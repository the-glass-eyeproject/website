import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, storeTokens } from '@/lib/google-drive-supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/upload?error=no_code', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/upload?error=config', request.url));
    }

    const oauth2Client = getOAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    const { tokens } = await oauth2Client.getToken(code);
    storeTokens(tokens);

    return NextResponse.redirect(new URL('/upload?connected=true', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/upload?error=auth_failed', request.url));
  }
}
