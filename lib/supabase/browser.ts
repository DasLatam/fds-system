'use client'

import { createBrowserClient } from '@supabase/ssr'
import { requiredEnv } from './env'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
