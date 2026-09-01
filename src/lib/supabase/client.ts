import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../config/env';

const supabaseUrl = getEnv('SUPABASE_URL', '') || getEnv('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', '') || getEnv('VITE_SUPABASE_ANON_KEY', '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);

export function getSupabaseStatus() {
  return {
    configured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : 'Not configured (using architectural mock fallback)',
  };
}
