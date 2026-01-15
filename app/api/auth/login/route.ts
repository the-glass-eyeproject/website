import { NextRequest, NextResponse } from 'next/server';
import { getSecretCode, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Secret code is required' },
        { status: 400 }
      );
    }

    const secretCode = getSecretCode();

    if (code !== secretCode) {
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 401 }
      );
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
