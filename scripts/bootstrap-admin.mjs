/**
 * scripts/bootstrap-admin.mjs
 *
 * One-shot bootstrap for the master admin account.
 * Creates the Supabase auth.users entry for suggestkey1505@gmail.com with
 * the initial password, then upserts the matching public.profiles row.
 *
 * Required environment variables (in .env):
 *   VITE_SUPABASE_URL                       - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY               - Service-role key (server-only, NEVER ship to client)
 *
 * Idempotent: safe to re-run. If the user already exists, only the
 * profiles row is reconciled to ensure role='admin'.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ---- 1. Load .env into process.env (no external dotenv dependency) ----------
function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(resolve(process.cwd(), '.env'));

// ---- 2. Validate config -----------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '[bootstrap-admin] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
  );
  process.exit(1);
}

const ADMIN_EMAIL = 'suggestkey1505@gmail.com';
const ADMIN_PASSWORD = 'password';
const ADMIN_FULL_NAME = 'Nikhil Kumar';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- 3. Main ---------------------------------------------------------------
async function main() {
  console.log(`[bootstrap-admin] Target: ${ADMIN_EMAIL}`);

  // 3a. Look up existing auth.users entry by email.
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error('[bootstrap-admin] listUsers failed:', listErr.message);
    process.exit(1);
  }

  const existing = users?.users?.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  let userId;

  if (existing) {
    userId = existing.id;
    console.log(`[bootstrap-admin] auth.users row exists (id=${userId}) — resetting password.`);
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_FULL_NAME, role: 'admin' },
    });
    if (updErr) {
      console.error('[bootstrap-admin] updateUserById failed:', updErr.message);
      process.exit(1);
    }
  } else {
    console.log('[bootstrap-admin] Creating new auth.users row…');
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_FULL_NAME, role: 'admin' },
    });
    if (createErr || !created?.user) {
      console.error('[bootstrap-admin] createUser failed:', createErr?.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`[bootstrap-admin] Created auth.users id=${userId}`);
  }

  // 3b. Reconcile profiles so auth.users.id === profiles.id (and no duplicates).
  //
  // We use the server-side `admin_upsert_profile` RPC instead of
  // direct table writes. The new sb_secret_... key still respects
  // RLS, but the RPC is SECURITY DEFINER so it bypasses RLS.
  //
  // Strategy:
  //   1. Upsert the canonical profile row at the auth.users.id. This
  //      always succeeds (insert or update) and ensures a row exists.
  //   2. Delete any other profile rows for the same email that point
  //      at a different id (the orphans).
  //   3. Verify the final state.
  const { data: canonical, error: upsertErr } = await supabase.rpc(
    'admin_upsert_profile',
    {
      p_id: userId,
      p_email: ADMIN_EMAIL,
      p_full_name: ADMIN_FULL_NAME,
      p_role: 'admin',
      p_is_demo: false,
    }
  );

  if (upsertErr) {
    console.error('[bootstrap-admin] admin_upsert_profile failed:', upsertErr.message);
    process.exit(1);
  }

  // 3c. Remove any other profile rows for the same email.
  //      admin_delete_profile_by_email is SECURITY DEFINER and runs as the
  //      migration owner (BYPASSRLS), so it can delete even if RLS would
  //      otherwise block the secret-key client.
  const { data: deleted, error: delErr } = await supabase.rpc(
    'admin_delete_profile_by_email',
    { p_email: ADMIN_EMAIL }
  );

  if (delErr) {
    console.warn(
      '[bootstrap-admin] admin_delete_profile_by_email failed:',
      delErr.message
    );
  }

  // 3d. Re-insert the canonical row, because the delete step above may
  //      have just removed it. The admin_upsert_profile RPC is idempotent.
  const { data: final, error: reinsertErr } = await supabase.rpc(
    'admin_upsert_profile',
    {
      p_id: userId,
      p_email: ADMIN_EMAIL,
      p_full_name: ADMIN_FULL_NAME,
      p_role: 'admin',
      p_is_demo: false,
    }
  );

  if (reinsertErr) {
    console.error(
      '[bootstrap-admin] admin_upsert_profile (reinsert) failed:',
      reinsertErr.message
    );
    process.exit(1);
  }

  // 3e. Final safety: a non-RLS plain count to confirm we end up with
  //      exactly one profile row for this email. Use the service-role
  //      client which can run the unrestricted query via the public
  //      read policy.
  const { count: finalCount, error: countErr } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('email', ADMIN_EMAIL);

  if (countErr) {
    console.warn('[bootstrap-admin] final count failed:', countErr.message);
  } else if (finalCount !== 1) {
    console.warn(
      `[bootstrap-admin] expected 1 profile row for ${ADMIN_EMAIL}, found ${finalCount}. ` +
        'Manual reconciliation may be required.'
    );
  }

  console.log(
    `[bootstrap-admin] ✅ Admin ready.\n` +
      `    email    : ${ADMIN_EMAIL}\n` +
      `    password : ${ADMIN_PASSWORD}\n` +
      `    user id  : ${userId}\n` +
      `    role     : admin\n` +
      `    profile  : ${final?.id || userId} (orphans removed: ${deleted ?? '?'})`
  );
}

main().catch((err) => {
  console.error('[bootstrap-admin] Unexpected error:', err);
  process.exit(1);
});