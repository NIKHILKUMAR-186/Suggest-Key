/**
 * Suggest Key Environment Configuration Helper
 * Safely accesses and normalizes environment variables from .env / Vite import.meta.env
 */

export function getEnv(key: string, defaultValue: string = ''): string {
  try {
    const env = import.meta.env as Record<string, any> | undefined;
    if (env) {
      if (env[key] !== undefined && env[key] !== '') return String(env[key]);
      if (env[`VITE_${key}`] !== undefined && env[`VITE_${key}`] !== '') return String(env[`VITE_${key}`]);
    }
  } catch {
    // browser sandbox fallback
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key] !== undefined && process.env[key] !== '') return String(process.env[key]);
      if (process.env[`VITE_${key}`] !== undefined && process.env[`VITE_${key}`] !== '') return String(process.env[`VITE_${key}`]);
    }
  } catch {
    // ignore
  }

  try {
    const win = typeof window !== 'undefined' ? (window as any) : undefined;
    if (win?.__APP_ENV__) {
      if (win.__APP_ENV__[key] !== undefined && win.__APP_ENV__[key] !== '') return String(win.__APP_ENV__[key]);
      if (win.__APP_ENV__[`VITE_${key}`] !== undefined && win.__APP_ENV__[`VITE_${key}`] !== '') return String(win.__APP_ENV__[`VITE_${key}`]);
    }
  } catch {
    // ignore
  }

  return defaultValue;
}

export function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const val = getEnv(key);
  if (!val) return defaultValue;
  const normalized = val.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
    return false;
  }
  if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') {
    return true;
  }
  return defaultValue;
}

export function getNumberEnv(key: string, defaultValue: number): number {
  const val = getEnv(key);
  if (!val) return defaultValue;
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
}

export const ENV = {
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY', ''),
  APP_URL: getEnv('APP_URL', 'http://localhost:3000'),
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY', ''),
  NODE_ENV: getEnv('MODE', 'development'),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
