/**
 * Env helpers - Next/Vercel:
 * - En el BROWSER, las variables NEXT_PUBLIC_* deben leerse de forma ESTATICA:
 *     process.env.NEXT_PUBLIC_SUPABASE_URL
 *   NO sirve process.env[name] para esas.
 *
 * - Para variables SERVER/EDGE (Resend, Upstash, Service role), se puede usar requiredEnv(name).
 */

export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Solo para el browser (o código compartido) - acceso estático.
 */
export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return { url, anonKey };
}

/**
 * Server-only (service role).
 */
export function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return { url, serviceRoleKey };
}