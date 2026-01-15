import { NextResponse } from 'next/server';
import fs from 'fs';
import { getTokenPath } from '@/lib/google-drive';

export async function POST() {
  try {
    const tokenPath = getTokenPath();
    if (fs.existsSync(tokenPath)) {
      fs.unlinkSync(tokenPath);
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
