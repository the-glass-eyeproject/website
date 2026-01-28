import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFile } from '@/lib/storage'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/photos/[id] - Get a single photo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get photo
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    // Check visibility
    if (!photo.is_public && !user) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    // Get tags
    const { data: photoTags } = await supabase
      .from('photo_tags')
      .select(`
        tags (
          id,
          name,
          slug
        )
      `)
      .eq('photo_id', id)
    
    const tags = photoTags?.map(pt => pt.tags).filter(Boolean) || []
    
    return NextResponse.json({ ...photo, tags })
  } catch (error) {
    console.error('Error in GET /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/photos/[id] - Update a photo
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, description, is_public, tags } = body
    
    // Update photo
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (is_public !== undefined) updateData.is_public = is_public
    
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('photos')
        .update(updateData)
        .eq('id', id)
      
      if (updateError) {
        console.error('Error updating photo:', updateError)
        return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
      }
    }
    
    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Delete existing photo_tags
      await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', id)
      
      // Add new tags
      if (tags.length > 0) {
        const { data: tagRecords } = await supabase
          .from('tags')
          .select('id, slug, name')
          .or(`slug.in.(${tags.join(',')}),name.in.(${tags.join(',')})`)
        
        if (tagRecords && tagRecords.length > 0) {
          const photoTagInserts = tagRecords.map(tag => ({
            photo_id: id,
            tag_id: tag.id,
          }))
          
          await supabase.from('photo_tags').insert(photoTagInserts)
        }
      }
    }
    
    // Fetch updated photo with tags
    const { data: updatedPhoto } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single()
    
    const { data: photoTags } = await supabase
      .from('photo_tags')
      .select(`
        tags (
          id,
          name,
          slug
        )
      `)
      .eq('photo_id', id)
    
    const updatedTags = photoTags?.map(pt => pt.tags).filter(Boolean) || []
    
    return NextResponse.json({ ...updatedPhoto, tags: updatedTags })
  } catch (error) {
    console.error('Error in PATCH /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/photos/[id] - Delete a photo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get photo to get storage key
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_key')
      .eq('id', id)
      .single()
    
    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    // Delete from storage
    try {
      await deleteFile(photo.storage_key)
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage fails
    }
    
    // Delete from database (cascade will delete photo_tags)
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Error deleting photo:', deleteError)
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
