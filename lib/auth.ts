// Authentication utilities using Supabase Auth
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * Get current user (server-side)
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * Sign in with email and password (client-side)
 */
export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw error
  }
  
  return data
}

/**
 * Sign out (client-side)
 */
export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}

/**
 * Get session (client-side)
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
