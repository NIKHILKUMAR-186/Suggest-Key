import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { UserRole } from '../../lib/supabase/types';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  User,
  Award,
  ShieldAlert,
  Clock,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    signIn,
    resetPassword,
    isConfigured,
    config,
    isCooldownActive,
    cooldownSecondsRemaining,
    failedAttempts,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial auth mode based on config
  const initialMode = config.PASSWORD_AUTH_ENABLED
    ? 'password'
    : config.MAGIC_LINK_ENABLED
    ? 'otp'
    : 'password';

  const [authMode, setAuthMode] = useState<'password' | 'otp'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('seeker');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Forgot password modal / state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string }>({});

  // Return to intended location if redirected by ProtectedRoute
  const fromLocation = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (authMode === 'password' && isConfigured && !password) {
      setErrorMsg('Please enter your password');
      return;
    }

    if (isCooldownActive) {
      setErrorMsg(
        `Login cooldown active. Please wait ${cooldownSecondsRemaining}s before attempting again.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await signIn(email, authMode === 'password' ? password : undefined, selectedRole);
    setLoading(false);

    if (res.success) {
      if (authMode === 'otp' && isConfigured) {
        setOtpSent(true);
      } else {
        const dest =
          fromLocation ||
          (selectedRole === 'admin'
            ? '/admin'
            : selectedRole === 'mentor'
            ? '/mentor'
            : '/seeker');
        navigate(dest, { replace: true });
      }
    } else {
      setErrorMsg(res.error || 'Failed to authenticate');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ success: false, message: 'Please provide your account email' });
      return;
    }
    setResetLoading(true);
    setResetStatus({});
    const res = await resetPassword(resetEmail);
    setResetLoading(false);
    setResetStatus({
      success: res.success,
      message: res.message || res.error,
    });
  };

  const handleDemoQuickLogin = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);
    setErrorMsg('');
    const demoEmail =
      role === 'admin'
        ? 'suggestkey1505@gmail.com'
        : role === 'mentor'
        ? 'saveralaptop@gmail.com'
        : 'saveraraj990@gmail.com';
    setEmail(demoEmail);

    const res = await signIn(demoEmail, undefined, role);
    setLoading(false);

    if (res.success) {
      const dest =
        fromLocation ||
        (role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/seeker');
      navigate(dest, { replace: true });
    } else {
      setErrorMsg(res.error || 'Failed to sign in');
    }
  };

  const showBothAuthTabs = config.PASSWORD_AUTH_ENABLED && config.MAGIC_LINK_ENABLED;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between p-6">
      {/* Header */}
      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#15846e] to-[#8052ff] flex items-center justify-center p-[1px]">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#8052ff] rounded-xs rotate-45" />
            </div>
          </div>
          <span className="font-medium text-sm">Suggest Key</span>
        </Link>
      </div>

      {/* Center Authentication Card */}
      <div className="max-w-md w-full mx-auto space-y-8 py-10">
        <div className="space-y-2 text-center">
          <span className="text-xs uppercase tracking-widest text-[#8052ff] font-semibold">
            Authentication
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-white">
            Welcome back
          </h1>
          <p className="text-sm text-[#9a9a9a] font-light">
            Sign in to access your sessions, bookings, and advisor portal
          </p>
        </div>

        {/* Development Auth Bypass / Notice Badge if applicable */}
        {(config.DEV_AUTH_BYPASS || !config.AUTH_ENABLED) && (
          <div className="p-3 rounded-2xl bg-[#ffb829]/10 border border-[#ffb829]/30 text-xs text-[#ffb829] flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#ffb829]" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-[10px] block">
                Development Auth Controls Active
              </span>
              <span>
                {config.DEV_AUTH_BYPASS
                  ? `Dev Auth Bypass enabled (Default Role: ${config.DEV_AUTH_ROLE})`
                  : 'Master Auth disabled: Open development access'}
              </span>
            </div>
          </div>
        )}

        {/* Cooldown Active Alert */}
        {isCooldownActive && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-[10px] block text-amber-200">
                Security Cooldown Active
              </span>
              <span>
                Too many failed login attempts. Please wait{' '}
                <strong className="text-white font-mono">{cooldownSecondsRemaining}s</strong> before
                retrying.
              </span>
            </div>
          </div>
        )}

        {otpSent ? (
          <div className="p-8 rounded-[24px] border border-[#15846e]/30 bg-[#15846e]/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#15846e]/20 text-[#15846e] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-white">Check your email</h3>
            <p className="text-xs text-[#bdbdbd] leading-relaxed">
              We have sent a secure magic sign-in link to{' '}
              <span className="text-white font-medium">{email}</span>. Click the link in your inbox
              to proceed.
            </p>
            <button
              onClick={() => setOtpSent(false)}
              className="text-xs text-[#8052ff] uppercase tracking-wider font-semibold hover:underline pt-2 block mx-auto"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.02] space-y-6">
            {/* Auth Mode Toggle (Only if both modes are allowed) */}
            {showBothAuthTabs ? (
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={`py-2 rounded-xl transition-all ${
                    authMode === 'password'
                      ? 'bg-[#8052ff] text-white shadow-sm'
                      : 'text-[#9a9a9a] hover:text-white'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('otp')}
                  className={`py-2 rounded-xl transition-all ${
                    authMode === 'otp'
                      ? 'bg-[#8052ff] text-white shadow-sm'
                      : 'text-[#9a9a9a] hover:text-white'
                  }`}
                >
                  Magic Link
                </button>
              </div>
            ) : (
              <div className="text-xs uppercase tracking-widest text-[#9a9a9a] text-center font-semibold pb-1">
                {authMode === 'password' ? 'Password Authentication' : 'Magic Link Authentication'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm pl-11"
                    required
                  />
                  <Mail className="w-4 h-4 text-[#9a9a9a] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {authMode === 'password' && config.PASSWORD_AUTH_ENABLED && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                      Password
                    </label>
                    {config.PASSWORD_RESET_ENABLED && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setShowForgotPassword(true);
                        }}
                        className="text-[11px] text-[#8052ff] hover:underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm pl-11 pr-11"
                      required={isConfigured}
                    />
                    <Lock className="w-4 h-4 text-[#9a9a9a] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isCooldownActive}
                className="w-full py-3.5 bg-[#8052ff] hover:bg-[#6c3df0] disabled:opacity-50 text-white rounded-full text-xs uppercase tracking-wider font-semibold transition-all shadow-md shadow-[#8052ff]/20 mt-2"
              >
                {loading
                  ? 'Authenticating...'
                  : authMode === 'password'
                  ? 'Sign In'
                  : 'Send Magic Link'}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#9a9a9a] block text-center font-semibold">
                Instant Role Fast-Track
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin('seeker')}
                  className="py-2 px-2 rounded-xl border border-white/10 hover:border-[#8052ff] bg-white/[0.02] hover:bg-[#8052ff]/10 text-xs text-center transition-all flex flex-col items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-[#8052ff]" />
                  <span className="text-[11px] text-white">Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin('mentor')}
                  className="py-2 px-2 rounded-xl border border-white/10 hover:border-[#15846e] bg-white/[0.02] hover:bg-[#15846e]/10 text-xs text-center transition-all flex flex-col items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5 text-[#15846e]" />
                  <span className="text-[11px] text-white">Mentor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin('admin')}
                  className="py-2 px-2 rounded-xl border border-white/10 hover:border-[#ffb829] bg-white/[0.02] hover:bg-[#ffb829]/10 text-xs text-center transition-all flex flex-col items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#ffb829]" />
                  <span className="text-[11px] text-white">Admin</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 rounded-[24px] border border-white/10 bg-[#0a0a0a] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#8052ff]" />
                  <h3 className="text-base font-medium text-white">Reset Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStatus({});
                  }}
                  className="text-xs text-[#9a9a9a] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#9a9a9a] leading-relaxed">
                Enter your account email below to receive secure password reset instructions.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm"
                    required
                  />
                </div>

                {resetStatus.message && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      resetStatus.success
                        ? 'bg-[#15846e]/10 border border-[#15846e]/30 text-[#15846e]'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {resetStatus.message}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetStatus({});
                    }}
                    className="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-[#9a9a9a] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-6 py-2 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs uppercase tracking-wider font-semibold disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-[#9a9a9a]">
          Do not have an account yet?{' '}
          <Link to="/signup" className="text-white hover:text-[#8052ff] underline font-semibold">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1280px] w-full mx-auto text-center text-xs text-[#9a9a9a] flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-[#15846e]" />
        <span>Participant data protected by PostgreSQL Row Level Security (RLS)</span>
      </div>
    </div>
  );
};

