-- ==============================================================================
-- Migration: 20260903_bootstrap_admin.sql
-- Description: Bootstrap step for the master admin account
--              (suggestkey1505@gmail.com / Nikhil Kumar).
--
-- IMPORTANT: This migration only creates the `public.profiles` row. The
-- corresponding `auth.users` entry MUST be created via the Supabase Auth
-- Admin API so the bcrypt-hashed password "password" is stored properly.
--
-- Run order:
--   1. supabase db push        (applies 20260903_lock_admin_role.sql)
--   2. npm run admin:bootstrap  (creates auth.users entry with password)
--   3. this migration then     (creates the matching profiles row)
--
-- This script is idempotent (ON CONFLICT DO NOTHING).
-- ==============================================================================

INSERT INTO public.profiles (id, email, full_name, avatar_url, role, is_anonymous_enabled, anonymous_name, is_demo, created_at, updated_at)
VALUES (
  '99999999-aaaa-bbbb-cccc-dddddddddddd',
  'suggestkey1505@gmail.com',
  'Nikhil Kumar',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'admin',
  false,
  null,
  false,
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
  role           = EXCLUDED.role,
  full_name      = EXCLUDED.full_name,
  updated_at     = timezone('utc'::text, now());

-- Also link by email in case the auth.users id is different.
UPDATE public.profiles
   SET role      = 'admin',
       full_name = COALESCE(NULLIF(full_name, ''), 'Nikhil Kumar'),
       updated_at = timezone('utc'::text, now())
 WHERE email = 'suggestkey1505@gmail.com'
   AND role <> 'admin';