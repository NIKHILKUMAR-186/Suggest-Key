-- ==============================================================================
-- Migration: 20260903_lock_admin_role.sql
-- Description: Locks the `role` column on public.profiles so users cannot
--              self-promote to 'admin' (or otherwise mutate their own role)
--              via direct INSERT/UPDATE. Only existing admins may change a
--              user's role, and that can only happen by calling the explicit
--              `promote_user_role(target_id, new_role)` RPC which performs the
--              role check itself.
-- ==============================================================================

-- 1. Create a SECURITY DEFINER helper that the trigger can use to identify
--    "the caller's role" without triggering RLS recursion.
CREATE OR REPLACE FUNCTION public.current_user_role_safe()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::text
    INTO v_role
    FROM public.profiles
   WHERE id = auth.uid();

  RETURN v_role;
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_role_safe() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role_safe() TO authenticated;

-- 2. BEFORE INSERT/UPDATE trigger: prevent any non-admin caller from setting
--    role to 'admin'. Also prevent non-admins from changing their own role.
CREATE OR REPLACE FUNCTION public.enforce_profile_role_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Only enforce when running as an authenticated user. Service-role
  -- (used by supabase admin / migrations) bypasses this guard.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_caller_role := public.current_user_role_safe();

  -- INSERT: a user creating their own profile may only be 'seeker' or 'mentor'.
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'admin' AND v_caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'ADMIN_ROLE_SELF_GRANT_FORBIDDEN: Only existing admins can create an admin account.'
        USING ERRCODE = '42501';
    END IF;
    -- Force role default for non-admin signups regardless of client payload.
    IF v_caller_role IS DISTINCT FROM 'admin' AND NEW.role = 'admin' THEN
      NEW.role := 'seeker';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: a user may not change their own role at all, and only admins may
  -- change anyone's role. Compare the NEW role to the OLD role.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'ADMIN_ROLE_CHANGE_FORBIDDEN: Only admins can change account roles.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_lock ON public.profiles;
CREATE TRIGGER trg_profiles_role_lock
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_lock();

-- 3. RLS-level safety net on UPDATE: even if a trigger is bypassed, RLS still
--    prevents a non-admin from changing their own role. We replace the old
--    "Users can update own profile" policy with one that excludes role writes
--    from non-admin self-updates.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 4. INSERT policy: explicitly reject 'admin' role from non-admin callers.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND (
      role <> 'admin'
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- 5. RPC: promote_user_role. Only callable by an existing admin. Performs the
--    role change in one place, returns the updated row.
CREATE OR REPLACE FUNCTION public.promote_user_role(
  p_target_user_id UUID,
  p_new_role       user_role
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role user_role;
  v_target      public.profiles;
BEGIN
  SELECT role INTO v_caller_role
    FROM public.profiles
   WHERE id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'PROMOTE_FORBIDDEN: Only admins can change account roles.'
      USING ERRCODE = '42501';
  END IF;

  -- Disallow demoting the last remaining admin.
  IF p_new_role IS DISTINCT FROM 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
       WHERE role = 'admin'
         AND id <> p_target_user_id
    ) THEN
      RAISE EXCEPTION 'PROMOTE_FORBIDDEN: Cannot demote the last remaining admin.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.profiles
     SET role = p_new_role,
         updated_at = timezone('utc'::text, now())
   WHERE id = p_target_user_id
   RETURNING * INTO v_target;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'PROMOTE_NOT_FOUND: Target user does not exist.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_target;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_role(UUID, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_role(UUID, user_role) TO authenticated;