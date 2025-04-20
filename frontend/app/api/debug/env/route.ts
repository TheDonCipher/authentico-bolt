import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get environment variables for debugging
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Not configured';
    const nodeEnv = process.env.NODE_ENV || 'development';
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || 'Not configured';
    const vercelEnv = process.env.VERCEL_ENV || 'Not on Vercel';
    
    // Check if we're running on Vercel
    const isVercel = typeof process.env.VERCEL !== 'undefined';
    
    // Return the configuration
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        apiUrl,
        nodeEnv,
        adminWallet,
        vercelEnv,
        isVercel,
        host: request.headers.get('host') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
