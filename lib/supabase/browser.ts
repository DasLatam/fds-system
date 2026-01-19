import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserEnv } from "./env";

let cachedBrowserClient: SupabaseClient | null = null;

/**
 * Supabase client para el navegador (SSR-friendly).
 * Usa cookies para PKCE, compatible con exchangeCodeForSession en server.
 */
export function createSupabaseBrowserClient() {
  if (cachedBrowserClient) return cachedBrowserClient;

  const { url, anonKey } = getSupabaseBrowserEnv();

  cachedBrowserClient = createBrowserClient(url, anonKey);

  return cachedBrowserClient;
}

export const supabaseBrowser = createSupabaseBrowserClient();