import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Profile, UserRole } from '../../lib/supabase/types';
import { authConfig, AuthConfig } from '../../config/authConfig';
import { MentorProfileService, MentorOnboardingState } from '../mentor/MentorProfileService';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'missing_profile' | 'error';

interface ProfileResolution {
  status: AuthStatus;
  profile: Profile | null;
  role: UserRole | null;
  mentorOnboardingState: MentorOnboardingState | null;
  mentorOnboardingLoading: boolean;
}

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isConfigured: boolean;
  config: AuthConfig;
  mentorOnboardingState: MentorOnboardingState | null;
  mentorOnboardingLoading: boolean;
  failedAttempts: number;
  isCooldownActive: boolean;
  cooldownSecondsRemaining: number;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signUp: (email: string, fullName: string, role: UserRole, password?: string, mentorData?: { headline?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 60 * 1000;
const USER_ROLES: UserRole[] = ['seeker', 'mentor', 'admin'];

function isUserRole(value: string | null | undefined): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [mentorOnboardingState, setMentorOnboardingState] = useState<MentorOnboardingState | null>(null);
  const [mentorOnboardingLoading, setMentorOnboardingLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number>(0);
  const requestSequence = useRef(0);
  const mountedRef = useRef(false);

  const loadProfile = async (userId: string): Promise<ProfileResolution> => {
    try {
      const { data: profData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profData) {
        return {
          status: 'missing_profile',
          profile: null,
          role: null,
          mentorOnboardingState: null,
          mentorOnboardingLoading: false,
        };
      }

      const resolvedProfile = profData as Profile;
      if (!isUserRole(resolvedProfile.role)) {
        return {
          status: 'error',
          profile: resolvedProfile,
          role: null,
          mentorOnboardingState: null,
          mentorOnboardingLoading: false,
        };
      }

      if (resolvedProfile.role !== 'mentor') {
        return {
          status: 'authenticated',
          profile: resolvedProfile,
          role: resolvedProfile.role,
          mentorOnboardingState: null,
          mentorOnboardingLoading: false,
        };
      }

      const mentorOnboardingState = await MentorProfileService.getMentorOnboardingState(userId);
      return {
        status: 'authenticated',
        profile: resolvedProfile,
        role: resolvedProfile.role,
        mentorOnboardingState,
        mentorOnboardingLoading: false,
      };
    } catch (err: any) {
      console.error('[Auth] Error loading profile:', err.message);
      return {
        status: 'error',
        profile: null,
        role: null,
        mentorOnboardingState: null,
        mentorOnboardingLoading: false,
      };
    }
  };

  const resolveSession = async (
    session: { user: { id: string } } | null,
    requestId: number
  ) => {
    if (!mountedRef.current || requestId !== requestSequence.current) {
      return;
    }

    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setMentorOnboardingState(null);
      setMentorOnboardingLoading(false);
      setAuthStatus('unauthenticated');
      return;
    }

    setUser(session.user);
    setProfile(null);
    setRole(null);
    setMentorOnboardingState(null);
    setMentorOnboardingLoading(false);
    setAuthStatus('loading');

    const resolution = await loadProfile(session.user.id);
    if (!mountedRef.current || requestId !== requestSequence.current) {
      return;
    }

    setProfile(resolution.profile);
    setRole(resolution.role);
    setMentorOnboardingState(resolution.mentorOnboardingState);
    setMentorOnboardingLoading(resolution.mentorOnboardingLoading);
    setAuthStatus(resolution.status);
  };

  const refreshAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Auth] Refresh session error:', error.message);
    }
    await resolveSession(session, ++requestSequence.current);
  };

  useEffect(() => {
    try {
      if (authConfig.LOGIN_ATTEMPT_LIMIT_ENABLED) {
        const storedAttempts = parseInt(localStorage.getItem('suggestkey_failed_attempts') || '0', 10);
        if (!isNaN(storedAttempts)) setFailedAttempts(storedAttempts);
      } else {
        localStorage.removeItem('suggestkey_failed_attempts');
        setFailedAttempts(0);
      }

      if (authConfig.LOGIN_COOLDOWN_ENABLED) {
        const storedCooldown = parseInt(localStorage.getItem('suggestkey_cooldown_until') || '0', 10);
        if (!isNaN(storedCooldown) && storedCooldown > Date.now()) {
          setCooldownUntil(storedCooldown);
        }
      } else {
        localStorage.removeItem('suggestkey_cooldown_until');
        setCooldownUntil(0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!authConfig.LOGIN_COOLDOWN_ENABLED || cooldownUntil <= Date.now()) {
      setCooldownSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured) {
      console.error('[Auth] Supabase is not configured. Authentication is unavailable.');
      setUser(null);
      setProfile(null);
      setRole(null);
      setMentorOnboardingState(null);
      setMentorOnboardingLoading(false);
      setAuthStatus('unauthenticated');
      return () => {
        mountedRef.current = false;
      };
    }

    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError.message);
        }
        await resolveSession(session, ++requestSequence.current);
      } catch (err: any) {
        if (!mountedRef.current) return;
        console.error('[Auth] Auth initialization error:', err.message);
        setUser(null);
        setProfile(null);
        setRole(null);
        setMentorOnboardingState(null);
        setMentorOnboardingLoading(false);
        setAuthStatus('error');
      }
    };

    void checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveSession(session, ++requestSequence.current);
    });

    return () => {
      mountedRef.current = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const isLoading = authStatus === 'loading';

  const recordFailedAttempt = () => {
    if (!authConfig.LOGIN_ATTEMPT_LIMIT_ENABLED) return;
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    localStorage.setItem('suggestkey_failed_attempts', newCount.toString());

    if (authConfig.LOGIN_COOLDOWN_ENABLED && newCount >= MAX_FAILED_ATTEMPTS) {
      const until = Date.now() + COOLDOWN_DURATION_MS;
      setCooldownUntil(until);
      localStorage.setItem('suggestkey_cooldown_until', until.toString());
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setCooldownUntil(0);
    localStorage.removeItem('suggestkey_failed_attempts');
    localStorage.removeItem('suggestkey_cooldown_until');
  };

  const isCooldownActive = Boolean(
    authConfig.LOGIN_COOLDOWN_ENABLED && cooldownUntil > Date.now()
  );

  const signIn = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Application is not configured. Please contact support.' };
    }

    if (isCooldownActive) {
      const remainingSec = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
      return {
        success: false,
        error: `Too many failed attempts. Login cooldown active. Please wait ${remainingSec}s before retrying.`,
      };
    }

    if (password && !authConfig.PASSWORD_AUTH_ENABLED) {
      return {
        success: false,
        error: 'Password authentication is currently disabled. Please use magic link sign-in.',
      };
    }
    if (!password && !authConfig.MAGIC_LINK_ENABLED) {
      return {
        success: false,
        error: 'Magic-link sign-in is currently disabled. Please sign in with password.',
      };
    }

    setAuthStatus('loading');
    setMentorOnboardingLoading(false);

    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          recordFailedAttempt();
          setUser(null);
          setProfile(null);
          setRole(null);
          setMentorOnboardingState(null);
          setMentorOnboardingLoading(false);
          setAuthStatus('unauthenticated');
          throw error;
        }
        if (data.user) {
          if (authConfig.EMAIL_VERIFICATION_REQUIRED && !data.user.email_confirmed_at) {
            setUser(null);
            setProfile(null);
            setRole(null);
            setMentorOnboardingState(null);
            setMentorOnboardingLoading(false);
            setAuthStatus('unauthenticated');
            return {
              success: false,
              requireVerification: true,
              error: 'Email verification is required before logging in. Please check your inbox.',
            };
          }

          resetFailedAttempts();
          await resolveSession(data.session ?? { user: data.user }, ++requestSequence.current);
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          recordFailedAttempt();
          setUser(null);
          setProfile(null);
          setRole(null);
          setMentorOnboardingState(null);
          setMentorOnboardingLoading(false);
          setAuthStatus('unauthenticated');
          throw error;
        }
        setAuthStatus('unauthenticated');
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in' };
    }
  };

  const signUp = async (
    email: string,
    fullName: string,
    selectedRole: UserRole,
    password?: string,
    mentorData?: { headline?: string; bio?: string }
  ) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Application is not configured. Please contact support.' };
    }

    if (selectedRole === 'admin') {
      return {
        success: false,
        error: 'Admin accounts can only be created by an existing administrator.',
      };
    }

    setAuthStatus('loading');
    setMentorOnboardingLoading(false);

    try {
      const authPassword = password || '';
      if (!authPassword) {
        setAuthStatus('unauthenticated');
        return { success: false, error: 'Password is required for registration.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
            headline: mentorData?.headline || '',
            bio: mentorData?.bio || '',
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: selectedRole,
        });
        if (profileError) throw profileError;

        if (selectedRole === 'mentor') {
          const { error: mentorError } = await supabase.from('mentors').upsert({
            id: data.user.id,
            headline: mentorData?.headline || 'Verified Advisor',
            bio: mentorData?.bio || '',
            verification_status: 'pending',
          });
          if (mentorError) throw mentorError;
        }

        if (authConfig.EMAIL_VERIFICATION_REQUIRED && !data.user.email_confirmed_at) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setMentorOnboardingState(null);
          setMentorOnboardingLoading(false);
          setAuthStatus('unauthenticated');
          return { success: true };
        }

        await resolveSession(data.session ?? { user: data.user }, ++requestSequence.current);
      }
      return { success: true };
    } catch (err: any) {
      setAuthStatus('unauthenticated');
      return { success: false, error: err.message || 'Failed to register' };
    }
  };

  const resetPassword = async (email: string) => {
    if (!authConfig.PASSWORD_RESET_ENABLED) {
      return {
        success: false,
        error: 'Password reset is currently disabled by administrator configuration.',
      };
    }

    if (!email) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Application is not configured. Please contact support.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      if (error) throw error;
      return {
        success: true,
        message: 'Password reset instructions have been dispatched to your email.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset.' };
    }
  };

  const signOut = async () => {
    setAuthStatus('loading');
    setMentorOnboardingLoading(false);

    if (!isSupabaseConfigured) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setMentorOnboardingState(null);
      setAuthStatus('unauthenticated');
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error('[Auth] signOut error:', err.message);
    } finally {
      setUser(null);
      setProfile(null);
      setRole(null);
      setMentorOnboardingState(null);
      setMentorOnboardingLoading(false);
      setAuthStatus('unauthenticated');
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    if (!isSupabaseConfigured) {
      return { success: false, error: 'Application is not configured. Please contact support.' };
    }

    const { id: _id, role: _role, ...safeUpdates } = updates;

    try {
      const { error: supabaseError } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', profile.id);

      if (supabaseError) {
        console.error('[Auth] Profile update error:', supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      setProfile((prev) => (prev ? { ...prev, ...safeUpdates } : null));
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Error updating profile:', err.message);
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        authStatus,
        isLoading,
        isConfigured: isSupabaseConfigured,
        config: authConfig,
        mentorOnboardingState,
        mentorOnboardingLoading,
        failedAttempts,
        isCooldownActive,
        cooldownSecondsRemaining,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateProfile,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
