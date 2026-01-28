// DigitalOcean Spaces Storage Service
// Compatible with AWS S3 SDK

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// Storage configuration from environment
const getStorageConfig = () => {
  const region = process.env.DO_SPACES_REGION || 'lon1'
  const accessKeyId = process.env.DO_SPACES_ACCESS_KEY
  const secretAccessKey = process.env.DO_SPACES_SECRET_KEY
  const bucket = process.env.DO_SPACES_BUCKET
  
  // Origin endpoint for API operations (uploads, deletes)
  const endpoint = process.env.DO_SPACES_ENDPOINT || `https://${region}.digitaloceanspaces.com`
  
  // CDN endpoint for public URLs (faster delivery)
  const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT || `https://${bucket}.${region}.cdn.digitaloceanspaces.com`

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'DigitalOcean Spaces configuration missing. Please set DO_SPACES_ACCESS_KEY, DO_SPACES_SECRET_KEY, and DO_SPACES_BUCKET in your .env.local file.'
    )
  }

  return { endpoint, cdnEndpoint, region, accessKeyId, secretAccessKey, bucket }
}

// Create S3 client for DO Spaces
const getS3Client = () => {
  const config = getStorageConfig()
  
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: false,
  })
}

export interface UploadResult {
  key: string
  url: string
  size: number
}

/**
 * Upload a file to DigitalOcean Spaces
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const config = getStorageConfig()
  const client = getS3Client()
  
  // Generate unique key with folder structure
  const ext = filename.split('.').pop() || 'jpg'
  const key = `photos/${uuidv4()}.${ext}`
  
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: 'public-read',
  })
  
  await client.send(command)
  
  // Construct public URL using CDN endpoint for faster delivery
  const url = `${config.cdnEndpoint}/${key}`
  
  return {
    key,
    url,
    size: file.length,
  }
}

/**
 * Delete a file from DigitalOcean Spaces
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client()
  
  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  })
  
  await client.send(command)
}

/**
 * Get a signed URL for private file access (for watermarking)
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const config = getStorageConfig()
  const client = getS3Client()
  
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  })
  
  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Get file as buffer (for watermarking)
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const config = getStorageConfig()
  const client = getS3Client()
  
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  })
  
  const response = await client.send(command)
  
  if (!response.Body) {
    throw new Error('Failed to get file from storage')
  }
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}
