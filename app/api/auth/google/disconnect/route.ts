import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createServiceClient();
    
    // Clear the Google Drive tokens
    const { error } = await supabase
      .from('google_drive_tokens')
      .update({
        access_token: '',
        refresh_token: '',
        expiry_date: null,
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
