import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get environment variables for debugging
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Not configured';
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Return the configuration
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        apiUrl,
        nodeEnv,
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
