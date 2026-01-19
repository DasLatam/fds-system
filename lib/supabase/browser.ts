import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "./env";

let cachedBrowserClient: SupabaseClient | null = null;

/**
 * Supabase client para el navegador (PKCE)
 * PKCE evita el hash (#access_token) y usa ?code=... -> ideal para route handler /auth/callback.
 */
export function createSupabaseBrowserClient() {
  if (cachedBrowserClient) return cachedBrowserClient;

  const { url, anonKey } = getSupabaseBrowserEnv();

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedBrowserClient;
}

export const supabaseBrowser = createSupabaseBrowserClient();