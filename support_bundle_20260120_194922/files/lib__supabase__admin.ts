import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "./env";

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cached;
}
