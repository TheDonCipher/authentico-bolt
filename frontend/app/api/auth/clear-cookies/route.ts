import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '../../../../lib/auth-cookies-server';

export async function POST(request: NextRequest) {
  try {
    // Create a response object
    const response = NextResponse.json({ success: true });

    // Clear auth cookies
    await clearAuthCookies();

    return response;
  } catch (error: any) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear cookies' },
      { status: 500 }
    );
  }
}
