import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileBuffer } from '@/lib/storage'
import sharp from 'sharp'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Create a watermark SVG that scales to image dimensions
 */
function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(16, Math.min(width, height) * 0.04)
  const padding = fontSize * 2
  
  // Create a repeating diagonal watermark pattern
  const text = 'THE GLASS EYE'
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" patternUnits="userSpaceOnUse" width="${fontSize * 12}" height="${fontSize * 6}" patternTransform="rotate(-30)">
          <text x="0" y="${fontSize}" 
                font-family="Georgia, serif" 
                font-size="${fontSize}px" 
                font-style="italic"
                fill="rgba(255,255,255,0.15)" 
                letter-spacing="0.2em">
            ${text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)"/>
      <text x="${width - padding}" y="${height - padding}" 
            font-family="Georgia, serif" 
            font-size="${fontSize * 0.8}px" 
            fill="rgba(255,255,255,0.4)" 
            text-anchor="end"
            letter-spacing="0.1em">
        © THE GLASS EYE PROJECT
      </text>
    </svg>
  `
  return Buffer.from(svg)
}

// GET /api/photos/[id]/download - Download photo (watermarked for public, original for admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if user is authenticated (admin)
    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin = !!user
    
    // Get photo
    const { data: photo, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    
    // Check visibility - private photos only accessible to admin
    if (!photo.is_public && !isAdmin) {
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
    if (isAdmin) {
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': photo.mime_type || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    
    // Public users get watermarked version
    const metadata = await sharp(fileBuffer).metadata()
    const width = metadata.width || 1920
    const height = metadata.height || 1080
    
    // Create watermark overlay
    const watermarkSvg = createWatermarkSvg(width, height)
    
    // Apply watermark to image
    const watermarkedBuffer = await sharp(fileBuffer)
      .composite([
        {
          input: watermarkSvg,
          top: 0,
          left: 0,
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer()
    
    const watermarkedFilename = photo.title 
      ? `${photo.title.replace(/[^a-z0-9]/gi, '_')}_glasseye.jpg`
      : `glasseye_${photo.id}.jpg`
    
    return new NextResponse(new Uint8Array(watermarkedBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${watermarkedFilename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/photos/[id]/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
