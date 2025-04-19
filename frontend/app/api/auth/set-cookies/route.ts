import { NextRequest, NextResponse } from 'next/server';
import {
  setAuthCookie,
  setUserDataCookie,
} from '../../../../lib/auth-cookies-server';

export async function POST(request: NextRequest) {
  try {
    const { token, userData } = await request.json();

    if (!token || !userData) {
      return NextResponse.json(
        { error: 'Token and user data are required' },
        { status: 400 }
      );
    }

    // Create a response object
    const response = NextResponse.json({ success: true });

    // Set auth token cookie
    await setAuthCookie(token);

    // Set user data cookie for middleware
    await setUserDataCookie(userData);

    return response;
  } catch (error: any) {
    console.error('Error setting cookies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set cookies' },
      { status: 500 }
    );
  }
}
