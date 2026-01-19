import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Admin client (service role). SERVER ONLY.
 * Usar solo en Route Handlers / Server Actions.
 */
export const supabaseAdmin = createClient(
  mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

export function createAdminClient() {
  return supabaseAdmin;
}
