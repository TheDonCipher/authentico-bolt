import { NextResponse } from 'next/server';

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    // Get environment variables for debugging
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Not configured';
    const nodeEnv = process.env.NODE_ENV || 'development';
    const adminWallet =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || 'Not configured';

    // Check if we can connect to the backend
    let backendStatus = 'unknown';
    let backendError: string | null = null;

    try {
      if (apiUrl !== 'Not configured') {
        console.log(`Checking backend health at: ${apiUrl}/health`);
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Short timeout to avoid hanging
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          backendStatus = data.status === 'ok' ? 'healthy' : 'unhealthy';
        } else {
          backendStatus = 'error';
          backendError = `Status ${response.status}`;
        }
      }
    } catch (error: any) {
      backendStatus = 'error';
      backendError = error.message || 'Unknown error';
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
        config: {
          apiUrl,
          adminWallet:
            adminWallet.substring(0, 6) +
            '...' +
            adminWallet.substring(adminWallet.length - 4),
        },
        services: {
          frontend: true,
          backend: backendStatus === 'healthy',
        },
        backend: {
          status: backendStatus,
          error: backendError,
        },
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
