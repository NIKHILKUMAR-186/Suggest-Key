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
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signUp: (email: string, fullName: string, role: UserRole, password?: string, mentorData?: { headline?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number>(0);

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
    if (!isSupabaseConfigured) {
      console.error('[Auth] Supabase is not configured. Authentication is unavailable.');
      setUser(null);
      setProfile(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

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
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Application is not configured. Please contact support.' };
    }

    if (selectedRole === 'admin') {
      return {
        success: false,
        error: 'Admin accounts can only be created by an existing administrator.',
      };
    }

    setIsLoading(true);

    try {
      const authPassword = password || '';
      if (!authPassword) {
        setIsLoading(false);
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
        setUser(data.user);
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
    setIsLoading(true);

    if (!isSupabaseConfigured) {
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

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    if (!isSupabaseConfigured) {
      return { success: false, error: 'Application is not configured. Please contact support.' };
    }

    try {
      const { error: supabaseError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (supabaseError) {
        console.error('[Auth] Profile update error:', supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
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
        updateProfile,
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
