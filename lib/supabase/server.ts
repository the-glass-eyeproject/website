import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from './types'

/**
 * Create a Supabase client for server-side operations
 * Uses the publishable key (replaces legacy anon key)
 * Combined with Supabase Auth for user-level access control via RLS
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.'
    )
  }

  return createServerClient<Database>(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client with elevated privileges for admin operations
 * Uses the secret key (replaces legacy service_role key)
 * 
 * WARNING: This bypasses Row Level Security!
 * Only use in secure server-side code, never expose to clients.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in your .env.local file.'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
