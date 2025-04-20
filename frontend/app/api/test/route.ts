import { NextResponse } from 'next/server';

// This is a simple test endpoint to verify that API routing is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API routing is working correctly',
    timestamp: new Date().toISOString(),
  });
}
