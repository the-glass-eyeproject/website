import { NextRequest, NextResponse } from 'next/server';
import { deletePhoto, getPhotoById } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photo = getPhotoById(id);
    
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete file from storage
    if (photo.storageProvider === 'local') {
      try {
        const filepath = join(process.cwd(), 'public', 'uploads', photo.storageKey);
        await unlink(filepath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue even if file deletion fails
      }
    }
    // For other storage providers, you'd implement deletion here

    // Delete from database
    const deleted = deletePhoto(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
