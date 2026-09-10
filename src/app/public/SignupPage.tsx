import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { UserRole } from '../../lib/supabase/types';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  User,
  Award,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Briefcase,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole: UserRole | null = requestedRole === 'mentor' ? 'mentor' : null;

  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mentor-specific onboarding fields
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [agreedToAudit, setAgreedToAudit] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [signedUpSuccess, setSignedUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      setErrorMsg('Please complete all required fields');
      return;
    }

    if (!selectedRole) {
      setErrorMsg('Please choose whether you are joining as a Seeker or Mentor');
      return;
    }

    if (isConfigured && (!password || password.length < 6)) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (selectedRole === 'mentor' && !headline) {
      setErrorMsg('Please enter your professional headline or specialization');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await signUp(
      email,
      fullName,
      selectedRole,
      password,
      selectedRole === 'mentor' ? { headline, bio } : undefined
    );
    setLoading(false);

    if (res.success) {
      if (isConfigured) {
        setSignedUpSuccess(true);
      } else {
        const dest = selectedRole === 'seeker' ? '/seeker' : '/mentor';
        navigate(dest, { replace: true });
      }
    } else {
      setErrorMsg(res.error || 'Failed to create account');
    }
  };

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

      {/* Main Registration Box */}
      <div className="max-w-lg w-full mx-auto space-y-8 py-10">
        <div className="space-y-2 text-center">
          <span className="text-xs uppercase tracking-widest text-[#8052ff] font-semibold">
            Onboarding
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.02em] text-white">
            Create your account
          </h1>
          <p className="text-sm text-[#9a9a9a] font-light">
            Join Suggest Key as a Seeker or apply as a Verified Mentor
          </p>
        </div>

        {signedUpSuccess ? (
          <div className="p-8 rounded-[28px] border border-[#15846e]/30 bg-[#15846e]/10 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#15846e]/20 text-[#15846e] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium text-white">Account Created Successfully</h3>
            <p className="text-sm text-[#bdbdbd] leading-relaxed">
              We sent a verification link to <span className="text-white font-medium">{email}</span>. Please verify your email to log into your{' '}
              <span className="text-[#8052ff] font-medium uppercase">{selectedRole}</span> account.
            </p>
            <div className="pt-3">
              <Link
                to="/login"
                className="inline-block px-8 py-3 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs uppercase tracking-wider font-semibold"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[28px] border border-white/10 bg-white/[0.02] space-y-6">
            {/* Role Switcher Cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('seeker')}
                className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                  selectedRole === 'seeker'
                    ? 'border-[#8052ff] bg-[#8052ff]/10 text-white shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-[#9a9a9a] hover:text-white'
                }`}
              >
                <User
                  className={`w-5 h-5 ${
                    selectedRole === 'seeker' ? 'text-[#8052ff]' : 'text-[#9a9a9a]'
                  }`}
                />
                <div>
                  <div className="text-sm font-medium">I am a Seeker</div>
                  <div className="text-[11px] text-[#9a9a9a] leading-tight">
                    Book verified 1:1 sessions & counsel
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('mentor')}
                className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                  selectedRole === 'mentor'
                    ? 'border-[#8052ff] bg-[#8052ff]/10 text-white shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-[#9a9a9a] hover:text-white'
                }`}
              >
                <Award
                  className={`w-5 h-5 ${
                    selectedRole === 'mentor' ? 'text-[#8052ff]' : 'text-[#9a9a9a]'
                  }`}
                />
                <div>
                  <div className="text-sm font-medium">I am a Mentor</div>
                  <div className="text-[11px] text-[#9a9a9a] leading-tight">
                    Publish offerings & advise clients
                  </div>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm"
                  required
                />
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              {/* Mentor-Specific Fields */}
              {selectedRole === 'mentor' && (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-[#ffb829] font-medium">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Mentor Profile & Verification Requirement</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                      Professional Headline / Specialty
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Licensed Clinical Psychologist & Career Coach"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-[#9a9a9a] block font-medium">
                      Professional Bio & Experience
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Summarize your credentials, years of practice, or domain background..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-[#9a9a9a]/40 focus:outline-none focus:border-[#8052ff] text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="audit-check"
                      checked={agreedToAudit}
                      onChange={(e) => setAgreedToAudit(e.target.checked)}
                      className="mt-1 rounded bg-white/5 border-white/20 text-[#8052ff] focus:ring-0"
                    />
                    <label htmlFor="audit-check" className="text-xs text-[#9a9a9a] leading-relaxed">
                      I understand that offering sessions in regulated categories (e.g. Mental Health) requires manual document & credential audit before publishing.
                    </label>
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
                disabled={loading || (selectedRole === 'mentor' && !agreedToAudit)}
                className="w-full py-3.5 bg-[#8052ff] hover:bg-[#6c3df0] disabled:opacity-50 text-white rounded-full text-xs uppercase tracking-wider font-semibold transition-all shadow-md shadow-[#8052ff]/20 mt-3"
              >
                {loading
                  ? 'Creating Account...'
                  : selectedRole === 'mentor'
                  ? 'Submit Advisor Registration'
                  : 'Complete Seeker Signup'}
              </button>
            </form>
          </div>
        )}

        <div className="text-center text-xs text-[#9a9a9a]">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-[#8052ff] underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1280px] w-full mx-auto text-center text-xs text-[#9a9a9a] flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-[#15846e]" />
        <span>Suggest Key Verification Standards • 2026 Audit Protocol</span>
      </div>
    </div>
  );
};
