// Supabase Storage helpers. All operations run on the server using the caller's
// Supabase session, so Storage Row Level Security remains in force.
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const BUCKET = 'gallery'

export interface UploadResult {
  key: string
  url: string
  size: number
}

export async function uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
  const supabase = await createClient()
  const extension = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const key = `photos/${uuidv4()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    contentType: mimeType,
    upsert: false,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  // The database stores the object path; the API creates short-lived signed URLs.
  return { key, url: key, size: file.length }
}

export async function deleteFile(key: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([key])
  if (error) throw new Error(`Image deletion failed: ${error.message}`)
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, expiresIn)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not create image link')
  return data.signedUrl
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(BUCKET).download(key)
  if (error || !data) throw new Error(error?.message || 'Could not download image')
  return Buffer.from(await data.arrayBuffer())
}
