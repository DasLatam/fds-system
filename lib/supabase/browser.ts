import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "./env";

let cached: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const { url, anonKey } = getSupabaseBrowserEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}

export const supabaseBrowser = createSupabaseBrowserClient();
