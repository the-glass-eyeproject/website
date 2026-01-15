import { NextResponse } from 'next/server';
import { getStoredTokens } from '@/lib/google-drive';

// Public endpoint to check if Google Drive tokens exist
// This doesn't require authentication since we need to know if tokens exist
// to determine if user needs to connect their Drive
export async function GET() {
  try {
    const tokens = getStoredTokens();
    const hasTokens = !!(tokens && tokens.access_token);
    
    return NextResponse.json({ hasTokens });
  } catch (error) {
    return NextResponse.json({ hasTokens: false });
  }
}
