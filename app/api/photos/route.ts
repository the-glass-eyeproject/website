import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSignedDownloadUrl } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = user?.app_metadata?.role === 'admin'
    const params = new URL(request.url).searchParams
    const tag = params.get('tag')
    const includePrivate = params.get('includePrivate') === 'true' && admin

    let query = supabase.from('photos').select('*').order('created_at', { ascending: false })
    if (!includePrivate) query = query.eq('is_public', true)

    const { data: photos, error } = await query
    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    }
    if (!photos?.length) return NextResponse.json([])

    const ids = photos.map(photo => photo.id)
    const { data: photoTags, error: tagsError } = await supabase
      .from('photo_tags')
      .select('photo_id, tags(id,name,slug)')
      .in('photo_id', ids)
    if (tagsError) console.error('Error fetching photo tags:', tagsError)

    const tagMap = new Map<string, { id: string; name: string; slug: string }[]>()
    for (const item of photoTags || []) {
      const existing = tagMap.get(item.photo_id) || []
      if (item.tags) existing.push(item.tags as unknown as { id: string; name: string; slug: string })
      tagMap.set(item.photo_id, existing)
    }

    let result = await Promise.all(photos.map(async photo => {
      let imageUrl = ''
      try {
        imageUrl = await getSignedDownloadUrl(photo.storage_key, 3600)
      } catch (urlError) {
        console.error('Could not create signed image URL:', urlError)
      }
      return { ...photo, storage_url: imageUrl, tags: tagMap.get(photo.id) || [] }
    }))

    if (tag) result = result.filter(photo => photo.tags.some(item => item.slug === tag || item.name === tag))
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Error in GET /api/photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, filename, storage_key, width, height, size, mime_type, is_public, tags } = body
    if (!filename || !storage_key) {
      return NextResponse.json({ error: 'filename and storage_key are required' }, { status: 400 })
    }

    const { data: photo, error } = await supabase.from('photos').insert({
      title: title || null,
      description: description || null,
      filename,
      storage_key,
      storage_url: storage_key,
      width: width ?? null,
      height: height ?? null,
      size: size ?? null,
      mime_type: mime_type ?? null,
      is_public: is_public === true,
      uploaded_by: user.id,
    }).select().single()

    if (error) {
      console.error('Error creating photo:', error)
      // Remove the uploaded object if its database record could not be created.
      await supabase.storage.from('gallery').remove([storage_key])
      return NextResponse.json({ error: 'Failed to create photo record' }, { status: 500 })
    }

    if (Array.isArray(tags) && tags.length) {
      const { data: tagRecords } = await supabase.from('tags').select('id,slug').in('slug', tags)
      if (tagRecords?.length) {
        const inserts = tagRecords.map(item => ({ photo_id: photo.id, tag_id: item.id }))
        const { error: linkError } = await supabase.from('photo_tags').insert(inserts)
        if (linkError) console.error('Could not attach photo tags:', linkError)
      }
    }

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
