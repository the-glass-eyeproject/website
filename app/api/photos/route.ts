import { NextResponse } from 'next/server';
import { getAllPhotos, savePhoto } from '@/lib/db';
import { listAllPhotos, getFolderName, getStoredTokens } from '@/lib/google-drive';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication - gallery is public, but API access can be restricted
    // Remove this check if you want the gallery to be fully public
    // const isAuthenticated = await verifySession();
    // if (!isAuthenticated) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    const storageProvider = process.env.STORAGE_PROVIDER || 'local';

    if (storageProvider === 'google-drive') {
      // Check if Google Drive is connected
      const tokens = getStoredTokens();
      if (!tokens || !tokens.access_token) {
        // Return empty array if not connected
        return NextResponse.json([]);
      }

      // Fetch all photos from Google Drive
      const drivePhotos = await listAllPhotos();
      
      // Map Drive photos to our format and sync with database
      const photos = await Promise.all(
        drivePhotos.map(async (drivePhoto) => {
          // Try to get tags from folder name (should be in photos/<tag>/ structure)
          let tags: string[] = [];
          if (drivePhoto.parents && drivePhoto.parents.length > 0) {
            const parentFolderName = await getFolderName(drivePhoto.parents[0]);
            if (parentFolderName && parentFolderName !== 'photos') {
              // If parent is not 'photos', it's a tag folder
              tags = [parentFolderName];
            }
          }

          // Check if photo exists in database
          const existingPhotos = getAllPhotos();
          const existing = existingPhotos.find(p => p.storageKey === drivePhoto.id);

          const photo = {
            id: existing?.id || drivePhoto.id,
            filename: drivePhoto.name,
            url: `https://drive.google.com/uc?export=view&id=${drivePhoto.id}`,
            storageKey: drivePhoto.id,
            storageProvider: 'google-drive',
            tags: existing?.tags || tags,
            uploadedAt: existing?.uploadedAt || drivePhoto.createdTime || new Date().toISOString(),
            size: existing?.size,
          };

          // Save to database if not exists
          if (!existing) {
            savePhoto(photo);
          }

          return photo;
        })
      );

      return NextResponse.json(photos);
    } else {
      // Local storage - use database
      const photos = getAllPhotos();
      return NextResponse.json(photos);
    }
  } catch (error) {
    console.error('Error fetching photos:', error);
    // If Drive error, fall back to database
    try {
      const photos = getAllPhotos();
      return NextResponse.json(photos);
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }
  }
}
