import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requiredEnv } from './env'

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore (server components)
          }
        }
      }
    }
  )
}
