import { UserRole } from '../lib/supabase/types';

export interface AuthConfig {
  /** Master authentication switch. Default: true */
  AUTH_ENABLED: boolean;

  /** Development-only authentication bypass. Default: false */
  DEV_AUTH_BYPASS: boolean;

  /** Require authenticated session for protected routes. Default: true */
  AUTH_ROUTE_GUARD: boolean;

  /** Password authentication enabled. Default: true */
  PASSWORD_AUTH_ENABLED: boolean;

  /** Magic-link authentication enabled. Default: true */
  MAGIC_LINK_ENABLED: boolean;

  /** Email verification requirement. Default: false */
  EMAIL_VERIFICATION_REQUIRED: boolean;

  /** Password reset enabled. Default: true */
  PASSWORD_RESET_ENABLED: boolean;

  /** Login/request rate limiting. Default: true */
  AUTH_RATE_LIMIT_ENABLED: boolean;

  /** Global application rate limiting. Default: true */
  RATE_LIMIT_ENABLED: boolean;

  /** Login cooldown on repeated attempts. Default: true */
  LOGIN_COOLDOWN_ENABLED: boolean;

  /** Failed-login attempt limit protection. Default: true */
  LOGIN_ATTEMPT_LIMIT_ENABLED: boolean;

  /** Role-based route authorization. Default: true */
  ROLE_GUARD_ENABLED: boolean;

  /** Development default role ('seeker' | 'mentor' | 'admin'). Default: seeker */
  DEV_AUTH_ROLE: UserRole;
}

function parseBooleanEnv(val: string | undefined, defaultValue: boolean): boolean {
  if (val === undefined || val === null || val === '') return defaultValue;
  const normalized = String(val).trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
    return false;
  }
  if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') {
    return true;
  }
  return defaultValue;
}

function parseRoleEnv(val: string | undefined, defaultRole: UserRole): UserRole {
  if (!val) return defaultRole;
  const normalized = String(val).trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'mentor') return 'mentor';
  if (normalized === 'seeker') return 'seeker';
  return defaultRole;
}

function getEnvVar(name: string): string | undefined {
  try {
    // 1. Check direct import.meta.env
    const env = import.meta.env as Record<string, any> | undefined;
    if (env) {
      if (env[name] !== undefined) return env[name];
      if (env[`VITE_${name}`] !== undefined) return env[`VITE_${name}`];
    }
  } catch {
    // ignore
  }

  // 2. Check process.env if in SSR / Node environment
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[name] !== undefined) return process.env[name];
      if (process.env[`VITE_${name}`] !== undefined) return process.env[`VITE_${name}`];
    }
  } catch {
    // ignore
  }

  // 3. Check window.__APP_ENV__ if injected
  try {
    const win = typeof window !== 'undefined' ? (window as any) : undefined;
    if (win?.__APP_ENV__) {
      if (win.__APP_ENV__[name] !== undefined) return win.__APP_ENV__[name];
      if (win.__APP_ENV__[`VITE_${name}`] !== undefined) return win.__APP_ENV__[`VITE_${name}`];
    }
  } catch {
    // ignore
  }

  return undefined;
}

/**
 * Global parsed Suggest Key Auth Configuration
 */
export const authConfig: AuthConfig = {
  AUTH_ENABLED: parseBooleanEnv(getEnvVar('AUTH_ENABLED'), true),
  DEV_AUTH_BYPASS: parseBooleanEnv(getEnvVar('DEV_AUTH_BYPASS'), false),
  AUTH_ROUTE_GUARD: parseBooleanEnv(getEnvVar('AUTH_ROUTE_GUARD'), true),
  PASSWORD_AUTH_ENABLED: parseBooleanEnv(getEnvVar('PASSWORD_AUTH_ENABLED'), true),
  MAGIC_LINK_ENABLED: parseBooleanEnv(getEnvVar('MAGIC_LINK_ENABLED'), true),
  EMAIL_VERIFICATION_REQUIRED: parseBooleanEnv(getEnvVar('EMAIL_VERIFICATION_REQUIRED'), false),
  PASSWORD_RESET_ENABLED: parseBooleanEnv(getEnvVar('PASSWORD_RESET_ENABLED'), true),
  AUTH_RATE_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('AUTH_RATE_LIMIT_ENABLED'), true),
  RATE_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('RATE_LIMIT_ENABLED'), true),
  LOGIN_COOLDOWN_ENABLED: parseBooleanEnv(getEnvVar('LOGIN_COOLDOWN_ENABLED'), true),
  LOGIN_ATTEMPT_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('LOGIN_ATTEMPT_LIMIT_ENABLED'), true),
  ROLE_GUARD_ENABLED: parseBooleanEnv(getEnvVar('ROLE_GUARD_ENABLED'), true),
  DEV_AUTH_ROLE: parseRoleEnv(getEnvVar('DEV_AUTH_ROLE'), 'seeker'),
};

/**
 * Diagnostic logger for development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('[Suggest Key] Active Auth Configuration Controls:', authConfig);
}
