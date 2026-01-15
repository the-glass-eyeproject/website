import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const endpoint = process.env.STORAGE_ENDPOINT;
    const region = process.env.STORAGE_REGION || 'us-east-1';
    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
    const bucket = process.env.STORAGE_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json(
        { error: 'S3/Spaces credentials not configured' },
        { status: 500 }
      );
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: endpoint.includes('digitaloceanspaces.com'), // Required for DO Spaces
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3/Spaces
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Construct public URL
    let fileUrl: string;
    if (endpoint.includes('digitaloceanspaces.com')) {
      // DigitalOcean Spaces URL format
      const regionMatch = endpoint.match(/https:\/\/([^.]+)\.digitaloceanspaces\.com/);
      const regionName = regionMatch ? regionMatch[1] : region;
      fileUrl = `https://${bucket}.${regionName}.digitaloceanspaces.com/${filename}`;
    } else {
      // Standard S3 URL format
      fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
    }

    return NextResponse.json({
      url: fileUrl,
      key: filename,
    });
  } catch (error) {
    console.error('S3/Spaces upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
