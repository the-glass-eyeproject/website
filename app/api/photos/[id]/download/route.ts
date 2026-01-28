import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileBuffer } from '@/lib/storage'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/photos/[id]/download - Download photo with watermark
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
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
    if (!photo.is_public) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
      }
    }
    
    // Get file from storage
    const fileBuffer = await getFileBuffer(photo.storage_key)
    
    // For now, we'll add a simple text watermark by returning the image with headers
    // In a production app, you'd use Sharp or Canvas to add a proper watermark
    // This is a placeholder - the watermark would be added visually
    
    const filename = photo.title 
      ? `${photo.title.replace(/[^a-z0-9]/gi, '_')}_glasseye.${photo.mime_type?.split('/')[1] || 'jpg'}`
      : `glasseye_${photo.id}.${photo.mime_type?.split('/')[1] || 'jpg'}`
    
    // Return the image with download headers
    // Note: For actual watermarking, you'd process the image with Sharp here
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': photo.mime_type || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Watermark': 'The Glass Eye Project',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/photos/[id]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
