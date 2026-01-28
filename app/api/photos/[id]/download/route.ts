import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileBuffer } from '@/lib/storage'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/photos/[id]/download - Download photo (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if user is authenticated (admin)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Only admin can download
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get photo
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    // Get file from storage
    const fileBuffer = await getFileBuffer(photo.storage_key)
    
    // Generate filename
    const ext = photo.mime_type?.split('/')[1] || 'jpg'
    const filename = photo.title 
      ? `${photo.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`
      : `photo_${photo.id}.${ext}`
    
    // Admin gets original file without watermark
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': photo.mime_type || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/photos/[id]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
