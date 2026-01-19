import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "./env";

let cachedBrowserClient: SupabaseClient | null = null;

/**
 * Supabase client para el navegador.
 * (Session en localStorage + detectSessionInUrl para magic links)
 */
export function createSupabaseBrowserClient() {
  if (cachedBrowserClient) return cachedBrowserClient;

  const { url, anonKey } = getSupabaseBrowserEnv();

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedBrowserClient;
}

// Export común (si lo usás directo en componentes client)
export const supabaseBrowser = createSupabaseBrowserClient();