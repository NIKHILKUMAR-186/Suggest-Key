/**
 * Server-side OTP orchestration for the custom auth flow.
 *
 * Rule enforcement (expiry, attempt cap, one-time use, resend cooldown,
 * previous-OTP invalidation) lives inside the SECURITY DEFINER DB functions
 * in supabase/migrations/20260916000000_auth_otps.sql. This module is the
 * thin HTTP-agnostic wrapper the Express routes call.
 *
 * The OTP is generated ONCE here, hashed, and the hash is sent to the DB.
 * The plaintext code only ever exists transiently in this process and in the
 * emailed message. It is never persisted, never logged.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOtpEmail } from "@/server/email";
import { createHash } from "node:crypto";

export type OtpPurpose = "signup" | "password_reset";

export interface IssueOtpResult {
  success: true;
  otpId: string;
}

export interface IssueOtpFailure {
  success: false;
  error: "cooldown" | "server_error";
}

export type IssueOtpResponse = IssueOtpResult | IssueOtpFailure;

export interface VerifyOtpResult {
  success: true;
}

export interface VerifyOtpFailure {
  success: false;
  error: "invalid_or_expired" | "max_attempts" | "server_error";
}

export type VerifyOtpResponse = VerifyOtpResult | VerifyOtpFailure;

const OTP_LENGTH = 6;

/** Cryptographically secure 6-digit numeric OTP. */
export function generateOtp(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const value = new DataView(bytes.buffer).getUint32(0, false) % 10000;
  return String(value).padStart(OTP_LENGTH, "0");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Hash an OTP with the server-side pepper (OTP_PEPPER). The pepper is read
 * from the server environment and never logged.
 */
export function hashOtp(otp: string): string {
  const pepper = process.env.OTP_PEPPER;
  if (!pepper) {
    throw new Error("OTP_PEPPER is not configured");
  }
  return createHash("sha256").update(otp + pepper).digest("hex");
}

export async function issueOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<IssueOtpResponse> {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: "server_error" };
  }

  const otp = generateOtp();
  let otpHash: string;
  try {
    otpHash = hashOtp(otp);
  } catch (err) {
    console.error("[otp] hashOtp failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "server_error" };
  }

  let otpId: string;
  try {
    const { data, error } = await supabaseAdmin.rpc("issue_auth_otp_hashed", {
      p_email: normalized,
      p_purpose: purpose,
      p_otp_hash: otpHash,
    });
    if (error || !data) {
      console.error("[otp] issue_auth_otp_hashed failed", {
        purpose,
        error: error?.message,
      });
      return { success: false, error: "server_error" };
    }
    otpId = String(data);
  } catch (err) {
    console.error("[otp] issue_auth_otp_hashed threw", {
      purpose,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "server_error" };
  }

  try {
    await sendOtpEmail({ to: normalized, otp, purpose });
  } catch (err) {
    // Email delivery failed: leave the OTP row active so the user can retry
    // the resend. Never mark the row verified or return success.
    console.error("[otp] email delivery failed", {
      purpose,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "server_error" };
  }

  return { success: true, otpId };
}

export async function verifyOtp(
  otpId: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  if (!otpId || !otp || !/^[0-9]{6}$/.test(otp)) {
    return { success: false, error: "invalid_or_expired" };
  }

  let otpHash: string;
  try {
    otpHash = hashOtp(otp);
  } catch (err) {
    console.error("[otp] hashOtp failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "server_error" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("verify_auth_otp", {
      p_otp_id: otpId,
      p_otp: otp,
      p_otp_hash: otpHash,
    });
    if (error) {
      console.error("[otp] verify_auth_otp failed", { error: error.message });
      return { success: false, error: "server_error" };
    }
    return data ? { success: true } : { success: false, error: "invalid_or_expired" };
  } catch (err) {
    console.error("[otp] verify_auth_otp threw", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "server_error" };
  }
}

export async function consumeOtpRowsForEmail(
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  const normalized = normalizeEmail(email);
  try {
    await supabaseAdmin
      .from("auth_otps")
      .update({ verified: true })
      .eq("email", normalized)
      .eq("purpose", purpose)
      .eq("verified", false);
  } catch (err) {
    console.error("[otp] consumeOtpRowsForEmail failed", {
      purpose,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}