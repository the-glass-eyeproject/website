import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFile, getSignedDownloadUrl } from '@/lib/storage'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = user?.app_metadata?.role === 'admin'
    const { data: photo, error } = await supabase.from('photos').select('*').eq('id', id).single()
    if (error || !photo || (!photo.is_public && !admin)) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    const [{ data: photoTags }, imageUrl] = await Promise.all([
      supabase.from('photo_tags').select('tags(id,name,slug)').eq('photo_id', id),
      getSignedDownloadUrl(photo.storage_key, 3600),
    ])
    return NextResponse.json({
      ...photo,
      storage_url: imageUrl,
      tags: photoTags?.map(item => item.tags).filter(Boolean) || [],
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Error in GET /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, is_public, tags } = body
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (is_public !== undefined) updateData.is_public = is_public
    if (Object.keys(updateData).length) {
      const { error } = await supabase.from('photos').update(updateData).eq('id', id)
      if (error) return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
    }

    if (tags !== undefined && Array.isArray(tags)) {
      const { error: removeError } = await supabase.from('photo_tags').delete().eq('photo_id', id)
      if (removeError) return NextResponse.json({ error: 'Failed to update photo tags' }, { status: 500 })
      if (tags.length) {
        const { data: records } = await supabase.from('tags').select('id').in('slug', tags)
        if (records?.length) {
          const { error } = await supabase.from('photo_tags').insert(records.map(item => ({ photo_id: id, tag_id: item.id })))
          if (error) return NextResponse.json({ error: 'Failed to update photo tags' }, { status: 500 })
        }
      }
    }

    const { data: photo, error } = await supabase.from('photos').select('*').eq('id', id).single()
    if (error || !photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    const { data: photoTags } = await supabase.from('photo_tags').select('tags(id,name,slug)').eq('photo_id', id)
    const storage_url = await getSignedDownloadUrl(photo.storage_key, 3600)
    return NextResponse.json({ ...photo, storage_url, tags: photoTags?.map(item => item.tags).filter(Boolean) || [] })
  } catch (error) {
    console.error('Error in PATCH /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
    }

    const { data: photo, error } = await supabase.from('photos').select('storage_key').eq('id', id).single()
    if (error || !photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    const { error: deleteError } = await supabase.from('photos').delete().eq('id', id)
    if (deleteError) return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 })
    try { await deleteFile(photo.storage_key) } catch (storageError) {
      console.error('Photo record deleted but storage cleanup failed:', storageError)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
