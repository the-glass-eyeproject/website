// Authentication and administrator checks for server-side routes.
import { createClient } from '@/lib/supabase/server'

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.app_metadata?.role === 'admin'
  } catch {
    return false
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
