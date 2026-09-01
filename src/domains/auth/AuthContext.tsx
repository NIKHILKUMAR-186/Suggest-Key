import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Profile, UserRole } from '../../lib/supabase/types';
import { authConfig, AuthConfig } from '../../config/authConfig';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  config: AuthConfig;
  failedAttempts: number;
  isCooldownActive: boolean;
  cooldownSecondsRemaining: number;
  signIn: (email: string, password?: string, intendedRole?: UserRole) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signUp: (email: string, fullName: string, role: UserRole, password?: string, mentorData?: { headline?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  switchRoleForDemo?: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial architectural default for local mock simulation when no keys are provided
const DEFAULT_DEMO_PROFILES: Record<UserRole, Profile> = {
  seeker: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'saveraraj990@gmail.com',
    full_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'seeker',
    is_anonymous_enabled: false,
    anonymous_name: 'Seeker #884',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  mentor: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'saveralaptop@gmail.com',
    full_name: 'Dr. Evelyn Vasquez',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'mentor',
    is_anonymous_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'suggestkey1505@gmail.com',
    full_name: 'Platform Administrator',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    is_anonymous_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 60 * 1000; // 60 seconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number>(0);

  // Initialize failed attempts and cooldown state from localStorage
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

  // Cooldown countdown interval
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
    // 1. MASTER SWITCH: AUTH_ENABLED === false -> Auto-login with default role
    if (!authConfig.AUTH_ENABLED) {
      const defaultRole = authConfig.DEV_AUTH_ROLE || 'seeker';
      const prof = DEFAULT_DEMO_PROFILES[defaultRole];
      setUser({ id: prof.id, email: prof.email });
      setProfile(prof);
      setRole(defaultRole);
      setIsLoading(false);
      return;
    }

    // 2. DEV_AUTH_BYPASS: Immediately login with DEV_AUTH_ROLE
    if (authConfig.DEV_AUTH_BYPASS) {
      const devRole = authConfig.DEV_AUTH_ROLE || 'seeker';
      const prof = DEFAULT_DEMO_PROFILES[devRole];
      setUser({ id: prof.id, email: prof.email });
      setProfile(prof);
      setRole(devRole);
      setIsLoading(false);
      return;
    }

    // 3. Mock fallback when Supabase is not configured
    if (!isSupabaseConfigured) {
      const savedRole = localStorage.getItem('suggestkey_demo_role') as UserRole | null;
      if (savedRole && DEFAULT_DEMO_PROFILES[savedRole]) {
        const demoProf = DEFAULT_DEMO_PROFILES[savedRole];
        setUser({ id: demoProf.id, email: demoProf.email });
        setProfile(demoProf);
        setRole(demoProf.role);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false);
      return;
    }

    // 4. Live Supabase Authentication
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profData) {
            setProfile(profData as Profile);
            setRole((profData as Profile).role);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profData) {
          setProfile(profData as Profile);
          setRole((profData as Profile).role);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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
    password?: string,
    intendedRole: UserRole = 'seeker'
  ): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
    // 1. Development Auth Bypass or Unconfigured Supabase -> Instant Success
    if (authConfig.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      resetFailedAttempts();
      const demoProf =
        DEFAULT_DEMO_PROFILES[intendedRole] ||
        DEFAULT_DEMO_PROFILES[authConfig.DEV_AUTH_ROLE] ||
        DEFAULT_DEMO_PROFILES.seeker;
      setUser({ id: demoProf.id, email: email || demoProf.email });
      setProfile({ ...demoProf, email: email || demoProf.email });
      setRole(intendedRole);
      localStorage.setItem('suggestkey_demo_role', intendedRole);
      setIsLoading(false);
      return { success: true };
    }

    // 2. Check cooldown (only active if LOGIN_COOLDOWN_ENABLED is true)
    if (isCooldownActive) {
      const remainingSec = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
      return {
        success: false,
        error: `Too many failed attempts. Login cooldown active. Please wait ${remainingSec}s before retrying.`,
      };
    }

    // 3. Check password vs magic link policy
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

    setIsLoading(true);

    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          recordFailedAttempt();
          throw error;
        }
        if (data.user) {
          // Check email verification if required
          if (authConfig.EMAIL_VERIFICATION_REQUIRED && !data.user.email_confirmed_at) {
            setIsLoading(false);
            return {
              success: false,
              requireVerification: true,
              error: 'Email verification is required before logging in. Please check your inbox.',
            };
          }

          resetFailedAttempts();
          setUser(data.user);
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profData) {
            setProfile(profData as Profile);
            setRole((profData as Profile).role);
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
          recordFailedAttempt();
          throw error;
        }
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
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
    setIsLoading(true);
    if (authConfig.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      const demoProf = {
        ...DEFAULT_DEMO_PROFILES[selectedRole],
        email,
        full_name: fullName,
        role: selectedRole,
      };
      setUser({ id: demoProf.id, email });
      setProfile(demoProf);
      setRole(selectedRole);
      localStorage.setItem('suggestkey_demo_role', selectedRole);
      setIsLoading(false);
      return { success: true };
    }

    try {
      const authPassword = password || 'SuggestKeySecurePass123!';
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
        setUser(data.user);
        if (selectedRole === 'mentor') {
          await supabase.from('mentors').upsert({
            id: data.user.id,
            headline: mentorData?.headline || 'Verified Advisor',
            bio: mentorData?.bio || '',
            status: 'pending',
            verified_credentials: false,
          });
        }
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
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
        success: true,
        message: 'Password reset email simulated for local development.',
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
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      localStorage.removeItem('suggestkey_demo_role');
      setUser(null);
      setProfile(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setIsLoading(false);
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    const demoProf = DEFAULT_DEMO_PROFILES[newRole];
    setUser({ id: demoProf.id, email: demoProf.email });
    setProfile(demoProf);
    setRole(newRole);
    localStorage.setItem('suggestkey_demo_role', newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isConfigured: isSupabaseConfigured,
        config: authConfig,
        failedAttempts,
        isCooldownActive,
        cooldownSecondsRemaining,
        signIn,
        signUp,
        resetPassword,
        signOut,
        switchRoleForDemo,
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

