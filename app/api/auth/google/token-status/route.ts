import { NextResponse } from 'next/server';
import { isGoogleDriveConnected } from '@/lib/google-drive-supabase';

// Public endpoint to check if Google Drive is connected
// This doesn't require authentication since we need to know if Drive is connected
export async function GET() {
  try {
    const connected = await isGoogleDriveConnected();
    return NextResponse.json({ hasTokens: connected });
  } catch (error) {
    return NextResponse.json({ hasTokens: false });
  }
}
