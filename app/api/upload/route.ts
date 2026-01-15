import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { savePhoto } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { getOrCreateFolder, uploadFileToDrive, getStoredTokens } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const isAuthenticated = await verifySession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tagsJson = formData.get('tags') as string;
    const customName = formData.get('customName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const tags = tagsJson ? JSON.parse(tagsJson) : [];
    const storageProvider = process.env.STORAGE_PROVIDER || 'local';
    
    // Use custom name if provided, otherwise use original filename
    // Preserve file extension
    const fileExtension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    const finalFilename = customName && customName.trim() 
      ? `${customName.trim()}${fileExtension}` 
      : file.name;

    let photoUrl: string;
    let storageKey: string;

    if (storageProvider === 'google-drive') {
      // Check if Google Drive is connected
      const tokens = getStoredTokens();
      if (!tokens || !tokens.access_token) {
        return NextResponse.json(
          { error: 'Google Drive not connected. Please connect your Drive first.' },
          { status: 400 }
        );
      }

      // Get or create 'photos' folder first, then create tag folder inside it
      const photosFolderId = await getOrCreateFolder('photos');
      const primaryTag = tags.length > 0 ? tags[0] : 'Untagged';
      const tagFolderId = await getOrCreateFolder(primaryTag, photosFolderId);

      // Upload file to Drive
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${uuidv4()}-${finalFilename}`;
      
      const driveFile = await uploadFileToDrive(
        buffer,
        filename,
        file.type,
        tagFolderId
      );

      // Use direct view link for images
      photoUrl = `https://drive.google.com/uc?export=view&id=${driveFile.id}`;
      storageKey = driveFile.id;
    } else if (storageProvider === 'local') {
      // Local file storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${uuidv4()}-${finalFilename}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      await mkdir(uploadDir, { recursive: true });
      
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      photoUrl = `/uploads/${filename}`;
      storageKey = filename;
    } else {
      return NextResponse.json(
        { error: 'Unsupported storage provider' },
        { status: 400 }
      );
    }

    // Save photo metadata
    const photo = {
      id: uuidv4(),
      filename: finalFilename,
      url: photoUrl,
      storageKey,
      storageProvider,
      tags,
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };

    savePhoto(photo);

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
