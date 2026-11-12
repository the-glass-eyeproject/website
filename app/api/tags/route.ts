import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = user?.app_metadata?.role === 'admin'
    const { data: tags, error } = await supabase.from('tags').select('*').order('name')
    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const tag of tags || []) {
      let query = supabase.from('photo_tags')
        .select('photo_id, photos!inner(is_public)', { count: 'exact', head: true })
        .eq('tag_id', tag.id)
      if (!admin) query = query.eq('photos.is_public', true)
      const { count, error: countError } = await query
      if (countError) console.error('Error counting tagged photos:', countError)
      counts.set(tag.id, count || 0)
    }
    return NextResponse.json((tags || []).map(tag => ({ ...tag, count: counts.get(tag.id) || 0 })))
  } catch (error) {
    console.error('Error in GET /api/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
