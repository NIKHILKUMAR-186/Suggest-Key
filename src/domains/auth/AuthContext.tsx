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

// Demo user IDs from seed data (for development bypass only)
const DEMO_USER_IDS: Record<UserRole, string> = {
  seeker: '11111111-1111-1111-1111-111111111111',
  mentor: '22222222-2222-2222-2222-222222222222',
  admin: '33333333-3333-3333-3333-333333333333',
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
    // 1. MASTER SWITCH: AUTH_ENABLED === false -> No authentication
    if (!authConfig.AUTH_ENABLED) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    // 2. DEV_AUTH_BYPASS: Development-only fake auth (NO Supabase session)
    // WARNING: This mode does NOT authenticate with Supabase.
    // Database queries will fail with 401 unless RLS allows full anon access.
    if (authConfig.DEV_AUTH_BYPASS) {
      const devRole = authConfig.DEV_AUTH_ROLE || 'seeker';
      loadDemoProfile(devRole);
      return;
    }

    // 3. Mock fallback when Supabase is not configured
    if (!isSupabaseConfigured) {
      console.warn('[Auth] Supabase not configured. Authentication disabled.');
      setUser(null);
      setProfile(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    // 4. Live Supabase Authentication
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError.message);
        }
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          // No session - user must log in
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err: any) {
        console.error('[Auth] Auth initialization error:', err.message);
        setUser(null);
        setProfile(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
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

  /**
   * Load profile from Supabase using authenticated user ID.
   * No fallback to demo data - if profile doesn't exist, user has no access.
   */
  const loadProfile = async (userId: string) => {
    try {
      const { data: profData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[Auth] Profile load error:', profileError.message);
        setProfile(null);
        setRole(null);
        return;
      }

      if (profData) {
        setProfile(profData as Profile);
        setRole((profData as Profile).role);
      } else {
        console.warn('[Auth] No profile found for user:', userId);
        setProfile(null);
        setRole(null);
      }
    } catch (err: any) {
      console.error('[Auth] Error loading profile:', err.message);
      setProfile(null);
      setRole(null);
    }
  };

  /**
   * Load demo profile for development bypass ONLY.
   * This does NOT create a Supabase session - RLS-protected queries will fail.
   */
  const loadDemoProfile = async (demoRole: UserRole) => {
    console.warn('[Auth] DEV_AUTH_BYPASS is active - using demo auth (no Supabase session)');

    if (!isSupabaseConfigured) {
      // Fallback when Supabase is not configured
      setUser({ id: DEMO_USER_IDS[demoRole], email: `${demoRole}@suggestkey.demo` });
      setProfile({
        id: DEMO_USER_IDS[demoRole],
        email: `${demoRole}@suggestkey.demo`,
        full_name: demoRole === 'seeker' ? 'Alex Rivera' : demoRole === 'mentor' ? 'Dr. Evelyn Vasquez' : 'Platform Administrator',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: demoRole,
        is_anonymous_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setRole(demoRole);
      setIsLoading(false);
      return;
    }

    try {
      const demoUserId = DEMO_USER_IDS[demoRole];
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', demoUserId)
        .single();

      if (profData) {
        setUser({ id: profData.id, email: profData.email });
        setProfile(profData as Profile);
        setRole(profData.role);
      } else {
        // Fallback if demo user doesn't exist in database
        setUser({ id: demoUserId, email: `${demoRole}@suggestkey.demo` });
        setProfile({
          id: demoUserId,
          email: `${demoRole}@suggestkey.demo`,
          full_name: demoRole === 'seeker' ? 'Alex Rivera' : demoRole === 'mentor' ? 'Dr. Evelyn Vasquez' : 'Platform Administrator',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: demoRole,
          is_anonymous_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setRole(demoRole);
      }
    } catch (err: any) {
      console.error('[Auth] Error loading demo profile:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    // 1. Development Auth Bypass or Unconfigured Supabase -> Demo mode (no Supabase session)
    if (authConfig.DEV_AUTH_BYPASS || !isSupabaseConfigured) {
      console.warn('[Auth] signIn: Using demo auth (no Supabase session)');
      resetFailedAttempts();
      await loadDemoProfile(intendedRole);
      localStorage.setItem('suggestkey_demo_role', intendedRole);
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
          await loadProfile(data.user.id);

          // Verify profile was loaded
          if (!profile) {
            console.warn('[Auth] signIn: Profile not found for authenticated user');
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
      await loadDemoProfile(selectedRole);
      localStorage.setItem('suggestkey_demo_role', selectedRole);
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
        // Create profile in database
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: selectedRole,
        });
        if (selectedRole === 'mentor') {
          await supabase.from('mentors').upsert({
            id: data.user.id,
            headline: mentorData?.headline || 'Verified Advisor',
            bio: mentorData?.bio || '',
            verification_status: 'pending',
          });
        }
        await loadProfile(data.user.id);
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

    // Clear demo role from localStorage
    localStorage.removeItem('suggestkey_demo_role');

    if (!isSupabaseConfigured || authConfig.DEV_AUTH_BYPASS) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const switchRoleForDemo = (newRole: UserRole) => {
    loadDemoProfile(newRole);
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
