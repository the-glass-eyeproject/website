import { NextResponse } from 'next/server';
import { getStoredTokens } from '@/lib/google-drive';
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

    const tokens = getStoredTokens();
    const isConnected = !!(tokens && tokens.access_token);
    
    return NextResponse.json({ connected: isConnected });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}
