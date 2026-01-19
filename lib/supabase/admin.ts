import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Admin client (service role) - SERVER ONLY.
 * OJO: se inicializa LAZY para no romper builds si faltan env vars.
 */
export function createAdminClient() {
  if (cached) return cached;

  const url = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}

/**
 * Compat: algunos archivos importan `supabaseAdmin`.
 * Lo exponemos como getter lazy.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createAdminClient();
    // @ts-expect-error - Proxy passthrough
    return client[prop];
  },
});