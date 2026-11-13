import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileBuffer } from '@/lib/storage'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 })
    }
    const { data: photo, error } = await supabase.from('photos').select('*').eq('id', id).single()
    if (error || !photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    const fileBuffer = await getFileBuffer(photo.storage_key)
    const ext = photo.mime_type?.split('/')[1] || 'jpg'
    const filename = photo.title ? `${photo.title.replace(/[^a-z0-9]/gi, '_')}.${ext}` : `photo_${photo.id}.${ext}`
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': photo.mime_type || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error in photo download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
