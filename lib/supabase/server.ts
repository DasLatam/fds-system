import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase server client con cookies (Next 16: cookies() es async).
 * Úsalo en Server Components / Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  type CookieOptions = Parameters<typeof cookieStore.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En Server Components a veces no se permite setear cookies.
          // No rompemos render por eso.
        }
      },
    },
  });
}