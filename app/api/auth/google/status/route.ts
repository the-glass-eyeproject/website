import { NextResponse } from 'next/server';
import { isGoogleDriveConnected } from '@/lib/google-drive-supabase';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    // Only allow authenticated users to check connection status
    const isAuthenticated = await verifySession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connected = await isGoogleDriveConnected();
    
    return NextResponse.json({ connected });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}
