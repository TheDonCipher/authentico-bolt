import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Render
 * This endpoint is used by Render to verify the application is running
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    firebase: {
      // Only report if Firebase Admin environment variables are configured
      // Don't expose actual values
      adminConfigured: Boolean(
        process.env.FIREBASE_TYPE &&
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
      ),
      clientConfigured: Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      )
    }
  });
}
