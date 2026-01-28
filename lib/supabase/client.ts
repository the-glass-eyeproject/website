import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  // Using the new Supabase publishable key (replaces legacy anon key)
  // Safe to expose in client-side code
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
