import { UserRole } from '../lib/supabase/types';

export interface AuthConfig {
  AUTH_ENABLED: boolean;
  PASSWORD_AUTH_ENABLED: boolean;
  MAGIC_LINK_ENABLED: boolean;
  EMAIL_VERIFICATION_REQUIRED: boolean;
  PASSWORD_RESET_ENABLED: boolean;
  AUTH_RATE_LIMIT_ENABLED: boolean;
  RATE_LIMIT_ENABLED: boolean;
  LOGIN_COOLDOWN_ENABLED: boolean;
  LOGIN_ATTEMPT_LIMIT_ENABLED: boolean;
  ROLE_GUARD_ENABLED: boolean;
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

function getEnvVar(name: string): string | undefined {
  try {
    const env = import.meta.env as Record<string, unknown> | undefined;
    if (env) {
      if (env[name] !== undefined) return env[name] as string;
      if (env[`VITE_${name}`] !== undefined) return env[`VITE_${name}`] as string;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[name] !== undefined) return process.env[name];
      if (process.env[`VITE_${name}`] !== undefined) return process.env[`VITE_${name}`];
    }
  } catch {
    // ignore
  }

  try {
    const win = typeof window !== 'undefined' ? (window as Window & { __APP_ENV__?: Record<string, string> }) : undefined;
    if (win?.__APP_ENV__) {
      if (win.__APP_ENV__[name] !== undefined) return win.__APP_ENV__[name];
      if (win.__APP_ENV__[`VITE_${name}`] !== undefined) return win.__APP_ENV__[`VITE_${name}`];
    }
  } catch {
    // ignore
  }

  return undefined;
}

export const authConfig: AuthConfig = {
  AUTH_ENABLED: parseBooleanEnv(getEnvVar('AUTH_ENABLED'), true),
  PASSWORD_AUTH_ENABLED: parseBooleanEnv(getEnvVar('PASSWORD_AUTH_ENABLED'), true),
  MAGIC_LINK_ENABLED: parseBooleanEnv(getEnvVar('MAGIC_LINK_ENABLED'), true),
  EMAIL_VERIFICATION_REQUIRED: parseBooleanEnv(getEnvVar('EMAIL_VERIFICATION_REQUIRED'), false),
  PASSWORD_RESET_ENABLED: parseBooleanEnv(getEnvVar('PASSWORD_RESET_ENABLED'), true),
  AUTH_RATE_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('AUTH_RATE_LIMIT_ENABLED'), true),
  RATE_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('RATE_LIMIT_ENABLED'), true),
  LOGIN_COOLDOWN_ENABLED: parseBooleanEnv(getEnvVar('LOGIN_COOLDOWN_ENABLED'), true),
  LOGIN_ATTEMPT_LIMIT_ENABLED: parseBooleanEnv(getEnvVar('LOGIN_ATTEMPT_LIMIT_ENABLED'), true),
  ROLE_GUARD_ENABLED: parseBooleanEnv(getEnvVar('ROLE_GUARD_ENABLED'), true),
};

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('[Suggest Key] Active Auth Configuration Controls:', authConfig);
}
