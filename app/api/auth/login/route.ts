import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    if (data.user.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'This account is not authorised to administer the gallery' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
  }
}
