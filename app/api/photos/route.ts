import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PhotoWithTags } from '@/lib/supabase/types'

// GET /api/photos - Get all photos (public only for unauthenticated, all for authenticated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const includePrivate = searchParams.get('includePrivate') === 'true' && !!user
    
    // Build query
    let query = supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    
    // If not authenticated or not requesting private, only show public
    if (!includePrivate) {
      query = query.eq('is_public', true)
    }
    
    const { data: photos, error: photosError } = await query
    
    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    }
    
    if (!photos || photos.length === 0) {
      return NextResponse.json([])
    }
    
    // Get all photo IDs
    const photoIds = photos.map(p => p.id)
    
    // Fetch tags for these photos
    const { data: photoTags, error: tagsError } = await supabase
      .from('photo_tags')
      .select(`
        photo_id,
        tags (
          id,
          name,
          slug
        )
      `)
      .in('photo_id', photoIds)
    
    if (tagsError) {
      console.error('Error fetching photo tags:', tagsError)
    }
    
    // Create a map of photo_id to tags
    const tagMap = new Map<string, { id: string; name: string; slug: string }[]>()
    
    if (photoTags) {
      for (const pt of photoTags) {
        const tags = tagMap.get(pt.photo_id) || []
        if (pt.tags) {
          // Handle both single tag object and array
          const tagData = pt.tags as unknown as { id: string; name: string; slug: string }
          tags.push(tagData)
        }
        tagMap.set(pt.photo_id, tags)
      }
    }
    
    // Combine photos with their tags
    const photosWithTags: PhotoWithTags[] = photos.map(photo => ({
      ...photo,
      tags: tagMap.get(photo.id) || [],
    }))
    
    // Filter by tag if specified
    if (tag) {
      const filtered = photosWithTags.filter(p => 
        p.tags.some(t => t.slug === tag || t.name === tag)
      )
      return NextResponse.json(filtered)
    }
    
    return NextResponse.json(photosWithTags)
  } catch (error) {
    console.error('Error in GET /api/photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/photos - Create a new photo (authenticated only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      title, 
      description, 
      filename, 
      storage_key, 
      storage_url, 
      width, 
      height, 
      size, 
      mime_type, 
      is_public,
      tags 
    } = body
    
    if (!filename || !storage_key || !storage_url) {
      return NextResponse.json(
        { error: 'filename, storage_key, and storage_url are required' },
        { status: 400 }
      )
    }
    
    // Insert photo
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert({
        title,
        description,
        filename,
        storage_key,
        storage_url,
        width,
        height,
        size,
        mime_type,
        is_public: is_public ?? false,
        uploaded_by: user.id,
      })
      .select()
      .single()
    
    if (photoError) {
      console.error('Error creating photo:', photoError)
      return NextResponse.json({ error: 'Failed to create photo' }, { status: 500 })
    }
    
    // If tags are provided, link them
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Get tag IDs by slug or name
      const { data: tagRecords } = await supabase
        .from('tags')
        .select('id, slug, name')
        .or(`slug.in.(${tags.join(',')}),name.in.(${tags.join(',')})`)
      
      if (tagRecords && tagRecords.length > 0) {
        const photoTagInserts = tagRecords.map(tag => ({
          photo_id: photo.id,
          tag_id: tag.id,
        }))
        
        await supabase.from('photo_tags').insert(photoTagInserts)
      }
    }
    
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
