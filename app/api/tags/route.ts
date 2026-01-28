import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tags - Get all tags with photo counts
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all tags
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }
    
    // Get photo counts for each tag (only counting public photos for non-auth)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get counts
    const tagCounts = new Map<string, number>()
    
    if (tags) {
      for (const tag of tags) {
        let query = supabase
          .from('photo_tags')
          .select('photo_id, photos!inner(is_public)', { count: 'exact' })
          .eq('tag_id', tag.id)
        
        if (!user) {
          query = query.eq('photos.is_public', true)
        }
        
        const { count } = await query
        tagCounts.set(tag.id, count || 0)
      }
    }
    
    // Return tags with counts
    const tagsWithCounts = tags?.map(tag => ({
      ...tag,
      count: tagCounts.get(tag.id) || 0,
    })) || []
    
    return NextResponse.json(tagsWithCounts)
  } catch (error) {
    console.error('Error in GET /api/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
