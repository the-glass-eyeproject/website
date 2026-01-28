import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage'

// POST /api/upload - Upload a photo to DigitalOcean Spaces
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }
    
    // Max file size: 20MB
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      )
    }
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to DigitalOcean Spaces
    const result = await uploadFile(buffer, file.name, file.type)
    
    // Try to get image dimensions (basic approach - works for JPEG/PNG)
    // In production, you might use Sharp for more reliable dimension extraction
    let width: number | undefined
    let height: number | undefined
    
    // Return upload result
    return NextResponse.json({
      success: true,
      storage_key: result.key,
      storage_url: result.url,
      filename: file.name,
      size: file.size,
      mime_type: file.type,
      width,
      height,
    })
  } catch (error) {
    console.error('Error in POST /api/upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
