import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getActiveRole, getDashboardRoute, waitForSessionRestored, type AppRole } from "@/lib/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { signInWithGoogle } from "@/lib/google-auth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "signup-verify", "forgot", "reset-verify", "reset-complete", "complete-google"]).default("login").catch("login"),
  otpId: z.string().optional(),
  email: z.string().optional(),
});

type AuthMode = "login" | "signup" | "signup-verify" | "forgot" | "reset-verify" | "reset-complete" | "complete-google";

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    if (search.mode === "signup-verify") return;
    if (search.mode === "reset-verify") return;
    if (search.mode === "reset-complete") return;
    if (search.mode === "complete-google") return;
    const user = await waitForSessionRestored(4000, 250);
    if (!user) return;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Role lookup failed", rolesError);
      toast.error("Unable to determine your account role. Please try signing in again.");
      return;
    }

    const fetchedRoles = (roles ?? []).map((roleRow) => roleRow.role as AppRole);
    const activeRole = getActiveRole(fetchedRoles);
    if (!activeRole) return;

    const destination = getDashboardRoute(activeRole);
    throw redirect({ to: destination });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Suggest Key" },
      { name: "description", content: "Log in or create your Suggest Key account to find or offer help." },
      { property: "og:title", content: "Sign in — Suggest Key" },
      { property: "og:description", content: "Log in or create your Suggest Key account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const mode = search.mode;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [formMode, setFormMode] = useState<AuthMode>(mode);

  const switchMode = useCallback(
    (newMode: AuthMode, extra: { otpId?: string; email?: string } = {}) => {
      setFormMode(newMode);
      navigate({ to: "/auth", search: { mode: newMode, ...extra } });
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-[#f2f7fd] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#252b2f]">Suggest Key</h1>
        </div>
        {formMode === "login" && <LoginView onSwitch={switchMode} qc={qc} />}
        {formMode === "signup" && <SignupView onSwitch={switchMode} />}
        {formMode === "signup-verify" && (
          <OtpVerifyView mode="signup" email={search.email ?? ""} otpId={search.otpId ?? ""} onSwitch={switchMode} qc={qc} />
        )}
        {formMode === "forgot" && <ForgotPasswordView onSwitch={switchMode} />}
        {formMode === "reset-verify" && (
          <OtpVerifyView mode="password_reset" email={search.email ?? ""} otpId={search.otpId ?? ""} onSwitch={switchMode} qc={qc} />
        )}
        {formMode === "reset-complete" && <ResetCompleteView onSwitch={switchMode} />}
        {formMode === "complete-google" && <CompleteGoogleView onSwitch={switchMode} />}
      </div>
    </div>
  );
}

function AuthCard({
  children,
  title,
  description,
  logo,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  logo?: boolean;
}) {
  return (
    <Card className="border-[#d6dee6] bg-white shadow-sm" style={{ borderRadius: "16px" }}>
      <CardHeader className="space-y-1 pb-4">
        {logo && (
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="Suggest Key" className="h-12 w-12 object-contain" />
          </div>
        )}
        <CardTitle className="text-center text-xl font-bold text-[#252b2f]">{title}</CardTitle>
        <CardDescription className="text-center text-sm text-[#666e7e]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">{children}</CardContent>
    </Card>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666e7e] hover:text-[#252b2f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#116eee] focus-visible:ring-offset-2 rounded"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PrimaryButton({
  loading,
  children,
  onClick,
  type = "submit",
  disabled,
  loadingText,
}: {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
  disabled?: boolean;
  loadingText?: string;
}) {
  return (
    <Button
      type={type}
      disabled={disabled || loading}
      className="w-full bg-[#11ee92] text-[#252b2f] hover:bg-[#0ed47f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116eee] focus-visible:ring-offset-2"
      style={{ borderRadius: "45px" }}
      onClick={onClick}
    >
      {loading && loadingText ? loadingText : (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children)}
    </Button>
  );
}

function getSignupErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object")
    return "We could not create your account. Please try again.";
  const value = error as Record<string, unknown>;
  const code = String(value.code ?? "").toLowerCase();
  const message = String(value.message ?? "").toLowerCase();

  if (code.includes("user_already_exists") || message.includes("already registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (code.includes("invalid_email") || message.includes("invalid email"))
    return "Enter a valid email address.";
  if (code.includes("weak_password") || message.includes("password"))
    return "Choose a stronger password with at least 6 characters.";
  if (code === "42501" || message.includes("row-level security") || message.includes("permission denied"))
    return "Your account was created, but permission to finish your profile was denied.";
  if (message.includes("network") || message.includes("failed to fetch"))
    return "We could not connect to the server. Check your connection and try again.";
  return "We could not create your account. Please try again.";
}

/* ─── Login View ─── */
function LoginView({
  onSwitch,
  qc,
}: {
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      toast.error("Enter your email and password to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Login succeeded, but no user session was returned.");

      toast.success("Welcome back!");
      await qc.invalidateQueries();

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (rolesError) {
        console.error("Redirect lookup failed", rolesError);
        toast.error("Unable to determine your account role. Please try signing in again.");
        return;
      }

      const fetchedRoles = (roles ?? []).map((r) => r.role as AppRole);
      const activeRole = getActiveRole(Array.from(new Set(fetchedRoles)));

      if (!activeRole) {
        console.error("No role found for user", data.user.id);
        toast.error("No account role found. Please contact support.");
        return;
      }

      const destination = getDashboardRoute(activeRole);
      navigate({ to: destination });
    } catch (error) {
      console.error("Login failed", error);
      setErrorMsg("Email or password is incorrect.");
      toast.error("Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Log in" description="Enter your credentials to continue" logo>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
          </div>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onSwitch("forgot")}
              className="text-[13px] font-bold text-[#116eee] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        <PrimaryButton loading={loading}>Log in</PrimaryButton>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#d6dee6]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-[#666e7e]">Or continue with</span>
        </div>
      </div>
      <GoogleButton onClick={() => signInWithGoogle()} loading={loading} />
      <div className="mt-4 text-center text-xs text-[#666e7e]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch("signup")}
          className="font-bold text-[#116eee] hover:underline"
        >
          Sign up
        </button>
      </div>
    </AuthCard>
  );
}

/* ─── Signup View ─── */
function SignupView({
  onSwitch,
}: {
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setPasswordError("");

    if (!fullName.trim() || !email || !password || !confirmPassword) {
      toast.error("Fill in all fields to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      toast.error("Choose a stronger password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        const msg = result.error === "cooldown"
          ? "Please wait a moment before requesting another code."
          : "We could not send the verification code. Please try again.";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      if (result.alreadyExists) {
        const msg = "An account with this email already exists. Try logging in instead.";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      toast.success("Verification code sent!");
      onSwitch("signup-verify", { otpId: result.otpId, email: result.email });
    } catch (error) {
      console.error("Signup request failed", error);
      const msg = "We could not connect to the server. Check your connection and try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create account" description="Sign up to get started">
      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            placeholder="Enter your name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrorMsg("");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (passwordError && v === confirmPassword) {
                setPasswordError("");
              }
            }}
            placeholder="Create new password"
            autoComplete="new-password"
          />
          <p className="text-xs text-[#666e7e]">Password must contain at least 6 characters.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-confirm-password">Confirm password</Label>
          <PasswordInput
            id="signup-confirm-password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (passwordError && v === password) {
                setPasswordError("");
              }
            }}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {passwordError && (
            <p className="text-sm font-bold text-[#252b2f] bg-red-50 rounded px-3 py-2" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        <PrimaryButton loading={loading} loadingText="Creating account...">Create account</PrimaryButton>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#d6dee6]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-[#666e7e]">Or continue with</span>
          </div>
        </div>
        <GoogleButton onClick={() => signInWithGoogle("student")} loading={loading} />
        <p className="text-center text-xs text-[#666e7e]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("login")}
            className="font-bold text-[#116eee] hover:underline"
          >
            Log in
          </button>
        </p>
      </form>
    </AuthCard>
  );
}

/* ─── OTP Verification View (signup + password_reset) ─── */
function OtpVerifyView({
  mode,
  email,
  otpId,
  onSwitch,
  qc,
}: {
  mode: "signup" | "password_reset";
  email: string;
  otpId: string;
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [otpId]);

  const isSignup = mode === "signup";

  async function handleVerify() {
    if (!otp || otp.length !== 6) return;
    setLoading(true);
    setErrorMsg("");
    setServerError("");
    try {
      const response = await fetch("/api/auth/" + (isSignup ? "signup/verify" : "password-reset/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpId, otp }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.error === "max_attempts") {
          setErrorMsg("Too many incorrect attempts. Please request a new code.");
          return;
        }
        if (result.error === "server_error") {
          setServerError("We could not verify your code. Please try again.");
          return;
        }
        setErrorMsg("Invalid or expired code.");
        return;
      }

      setSuccess(true);
      toast.success(isSignup ? "Email verified!" : "Code verified.");

      if (isSignup) {
        await qc.invalidateQueries();
        navigate({ to: "/auth", search: { mode: "login" } });
      } else {
        onSwitch("reset-complete", { email });
      }
    } catch (error) {
      console.error("OTP verify failed", error);
      setServerError("We could not connect to the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResendLoading(true);
    setErrorMsg("");
    setServerError("");
    try {
      const response = await fetch("/api/auth/" + (isSignup ? "signup/request" : "password-reset/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.otpId) {
        setCooldown(60);
        setOtp("");
        toast.success("A new code has been sent.");
        onSwitch(isSignup ? "signup-verify" : "reset-verify", { otpId: result.otpId, email: result.email ?? email });
      } else {
        setServerError("We could not resend the code. Please try again later.");
      }
    } catch (error) {
      console.error("Resend failed", error);
      setServerError("We could not resend the code. Please try again later.");
    } finally {
      setResendLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard title="Code verified" description="">
        <div className="space-y-4 text-center">
          <svg className="mx-auto h-12 w-12 text-[#11ee92]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-[#252b2f]">
            {isSignup ? "Your email has been verified. You can now log in." : "Verify your new password next."}
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Verify your email" description="Enter the 6-digit code we sent.">
      <div className="space-y-4">
        <p className="text-sm text-[#666e7e]">
          We sent a 6-digit code to <span className="font-medium text-[#252b2f]">{email}</span>. It expires in 10 minutes.
        </p>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        {serverError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {serverError}
          </div>
        )}
        <PrimaryButton loading={loading} loadingText="Verifying..." onClick={handleVerify}>
          Verify code
        </PrimaryButton>
        <div className="text-center text-sm text-[#666e7e]">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            disabled={resendLoading || cooldown > 0}
            onClick={handleResend}
            className={`font-bold ${cooldown > 0 ? "text-[#9aa3b2]" : "text-[#116eee] hover:underline"}`}
          >
            {resendLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-[#252b2f] hover:bg-accent hover:text-accent-foreground"
          onClick={() => onSwitch("login")}
          style={{ borderRadius: "45px" }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to login
        </Button>
      </div>
    </AuthCard>
  );
}

/* ─── Forgot Password View ─── */
function ForgotPasswordView({
  onSwitch,
}: {
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    if (!email) {
      toast.error("Enter your email to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrorMsg("We couldn't send the reset code. Please try again.");
        toast.error("We couldn't send the reset code. Please try again.");
        return;
      }
      toast.success("Check your email");
      onSwitch("reset-verify", { email });
    } catch (error) {
      console.error("Reset request failed", error);
      setErrorMsg("We couldn't send the reset code. Please try again.");
      toast.error("We couldn't send the reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Reset your password" description="Enter the email associated with your account.">
      <form onSubmit={handleSendReset} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        <PrimaryButton loading={loading} loadingText="Sending...">Send reset code</PrimaryButton>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-[#252b2f] hover:bg-accent hover:text-accent-foreground"
          onClick={() => onSwitch("login")}
          style={{ borderRadius: "45px" }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to login
        </Button>
      </form>
    </AuthCard>
  );
}

/* ─── Forgot Password View ─── */
function ResetCompleteView({
  onSwitch,
}: {
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
}) {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const resetToken = search.otpId ?? "";
  const email = search.email ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    if (!resetToken) {
      setExpired(true);
    }
  }, [resetToken]);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      toast.error("Fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Choose a stronger password with at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, email, newPassword, confirmPassword }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.error && (String(result.error).includes("expired") || String(result.error).includes("used"))) {
          setExpired(true);
          return;
        }
        setErrorMsg(String(result.error || "Unable to reset your password. Please request a new reset and try again."));
        toast.error(String(result.error || "Unable to reset your password. Please request a new reset and try again."));
        return;
      }
      setSuccess(true);
      toast.success("Password updated successfully.");
    } catch (error) {
      console.error("Reset failed", error);
      setErrorMsg("Unable to reset your password. Please request a new reset and try again.");
      toast.error("Unable to reset your password. Please request a new reset and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard title="Password updated successfully" description="">
        <div className="space-y-4 text-center">
          <svg className="mx-auto h-12 w-12 text-[#11ee92]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-[#252b2f]">Password updated successfully.</p>
          <p className="text-sm text-[#666e7e]">You can now log in with your email and new password.</p>
          <PrimaryButton type="button" onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}>
            Back to login
          </PrimaryButton>
        </div>
      </AuthCard>
    );
  }

  if (expired) {
    return (
      <AuthCard title="Link expired" description="">
        <div className="space-y-4 text-center">
          <p className="text-sm text-[#252b2f]">
            This reset link has expired or already been used. Please request a new password reset.
          </p>
          <PrimaryButton type="button" onClick={() => onSwitch("forgot")}>
            Request new reset
          </PrimaryButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" description="Enter a new password">
      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reset-new-password">New password</Label>
          <PasswordInput
            id="reset-new-password"
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              if (passwordError && v === confirmPassword) {
                setPasswordError("");
              }
            }}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reset-confirm-password">Confirm password</Label>
          <PasswordInput
            id="reset-confirm-password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (passwordError && v === newPassword) {
                setPasswordError("");
              }
            }}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          {passwordError && (
            <p className="text-sm font-bold text-[#252b2f] bg-red-50 rounded px-3 py-2" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        <PrimaryButton loading={loading} loadingText="Updating password...">Update password</PrimaryButton>
      </form>
    </AuthCard>
  );
}

/* ─── Complete Google Account View ─── */
function CompleteGoogleView({
  onSwitch,
}: {
  onSwitch: (mode: AuthMode, extra?: { otpId?: string; email?: string }) => void;
}) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleComplete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setPasswordError("");

    if (!fullName.trim()) {
      toast.error("Enter your name to continue.");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Choose a stronger password with at least 6 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        user_metadata: { full_name: fullName.trim() },
        ...(password ? { password } : {}),
      });
      if (error) throw error;
      if (!data.user) throw new Error("Account completion failed.");

      toast.success("Account ready!");
      navigate({ to: "/seeker/home" });
    } catch (error) {
      console.error("Google completion failed", error);
      setErrorMsg("We could not complete your account. Please try again.");
      toast.error("We could not complete your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Complete your account" description="Add your name and an optional password.">
      <form onSubmit={handleComplete} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="google-name">Full name</Label>
          <Input
            id="google-name"
            placeholder="Enter your name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="google-password">Password (optional)</Label>
          <PasswordInput
            id="google-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (passwordError && v === confirmPassword) {
                setPasswordError("");
              }
            }}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="google-confirm-password">Confirm password</Label>
          <PasswordInput
            id="google-confirm-password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (passwordError && v === password) {
                setPasswordError("");
              }
            }}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {passwordError && (
            <p className="text-sm font-bold text-[#252b2f] bg-red-50 rounded px-3 py-2" role="alert">
              {passwordError}
            </p>
          )}
        </div>
        {errorMsg && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#252b2f] font-medium" role="alert">
            {errorMsg}
          </div>
        )}
        <PrimaryButton loading={loading} loadingText="Completing...">Complete account</PrimaryButton>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-[#252b2f] hover:bg-accent hover:text-accent-foreground"
          onClick={() => onSwitch("login")}
          style={{ borderRadius: "45px" }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to login
        </Button>
      </form>
    </AuthCard>
  );
}