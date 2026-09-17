-- =====================================================================
-- Suggest Key — Custom OTP auth (signup + password_reset)
-- Replaces Supabase built-in confirmation / recovery email flows.
-- Idempotent and safe to re-run.
-- =====================================================================

BEGIN;

-- 1. OTP store. Plaintext OTPs are NEVER persisted; only a SHA-256 hash
--    combined with a server-side pepper (OTP_PEPPER) is stored.
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  otp_hash    text NOT NULL,
  purpose     text NOT NULL CHECK (purpose IN ('signup', 'password_reset', 'reset_token')),
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  verified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email_purpose
  ON public.auth_otps (email, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at
  ON public.auth_otps (expires_at);

ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: this table is only reachable via the
-- SECURITY DEFINER helpers below. Service role (server) bypasses RLS.

-- 2. issue_auth_otp_hashed — enforce cooldown, invalidate previous OTPs
  --    for the same email+purpose, and persist the caller-supplied hash.
  --    The OTP itself is generated and hashed by the server process; the DB
  --    never sees the plaintext. Returns the opaque row id (never the OTP).
  --    Raises if the resend cooldown has not elapsed.
CREATE OR REPLACE FUNCTION public.issue_auth_otp_hashed(
  p_email text,
  p_purpose text,
  p_otp_hash text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_last_created timestamptz;
  v_otp_id uuid;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'email required';
  END IF;
  IF p_purpose NOT IN ('signup', 'password_reset', 'reset_token') THEN
    RAISE EXCEPTION 'invalid purpose';
  END IF;
  IF p_otp_hash IS NULL OR btrim(p_otp_hash) = '' THEN
    RAISE EXCEPTION 'otp_hash required';
  END IF;

  v_normalized := lower(btrim(p_email));

  -- 60-second resend cooldown (not enforced for reset_token rows).
  IF p_purpose <> 'reset_token' THEN
    SELECT created_at INTO v_last_created
    FROM public.auth_otps
    WHERE email = v_normalized AND purpose = p_purpose
    ORDER BY created_at DESC LIMIT 1;

    IF v_last_created IS NOT NULL
       AND now() - v_last_created < interval '60 seconds' THEN
      RAISE EXCEPTION 'cooldown';
    END IF;
  END IF;

  -- Invalidate any previous unverified OTPs for this email+purpose.
  UPDATE public.auth_otps
  SET verified = true
  WHERE email = v_normalized
    AND purpose = p_purpose
    AND verified = false;

  INSERT INTO public.auth_otps (email, otp_hash, purpose, expires_at)
  VALUES (v_normalized, p_otp_hash, p_purpose, now() + interval '10 minutes')
  RETURNING id INTO v_otp_id;

  RETURN v_otp_id;
END;
$$;

-- 3. verify_auth_otp — enforce expiry, attempt cap, one-time use.
  --    The caller supplies the plaintext OTP and its SHA-256 hash; the row's
  --    stored hash is compared directly so the pepper never reaches the DB.
  --    Returns true on success and marks the row verified.
CREATE OR REPLACE FUNCTION public.verify_auth_otp(
  p_otp_id uuid,
  p_otp text,
  p_otp_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.auth_otps%ROWTYPE;
BEGIN
  IF p_otp_id IS NULL OR p_otp IS NULL OR p_otp !~ '^[0-9]{6}$' THEN
    RETURN false;
  END IF;
  IF p_otp_hash IS NULL OR p_otp_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_row
  FROM public.auth_otps
  WHERE id = p_otp_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_row.verified THEN
    RETURN false;
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN false;
  END IF;
  IF v_row.attempts >= 5 THEN
    RETURN false;
  END IF;

  IF v_row.otp_hash <> p_otp_hash THEN
    UPDATE public.auth_otps SET attempts = attempts + 1 WHERE id = p_otp_id;
    RETURN false;
  END IF;

  UPDATE public.auth_otps
  SET verified = true, attempts = attempts + 1
  WHERE id = p_otp_id;

  RETURN true;
END;
$$;

-- 4. Cleanup helper for expired OTPs (run periodically / via cron).
CREATE OR REPLACE FUNCTION public.purge_expired_auth_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.auth_otps
  WHERE expires_at < now() - interval '1 hour';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_auth_otp_hashed(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_auth_otp(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_auth_otps() TO service_role;

COMMIT;