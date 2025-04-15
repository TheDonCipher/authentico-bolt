import { NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';

// Standardize on a single collection name
const USER_COLLECTION = 'users';

export async function POST(request: Request) {
  console.log('Login API route called');

  try {
    // Add a timeout to the request to prevent hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    // Parse the request body with timeout
    const bodyPromise = request.json();
    console.log('Parsing request body...');

    const body = (await Promise.race([bodyPromise, timeoutPromise])) as {
      walletAddress: string;
    };
    const { walletAddress } = body;
    console.log('Request body parsed, wallet address:', walletAddress);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists in Firestore using the standardized collection
      console.log(
        'Attempting to query Firestore for wallet address:',
        walletAddress
      );
      const usersRef = db.collection(USER_COLLECTION);
      console.log('Collection reference created for:', USER_COLLECTION);

      // Add timeout to Firestore query
      const queryPromise = usersRef
        .where('walletAddress', '==', walletAddress)
        .get();
      console.log('Query created, waiting for results...');

      const snapshot = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      console.log('Query completed successfully');
      console.log('Query results empty?', snapshot.empty);

      if (snapshot.empty) {
        return NextResponse.json(
          {
            error: 'NEW_USER',
            message:
              'This wallet is not registered yet. Please register first.',
          },
          { status: 404 }
        );
      }

      // User exists, create a custom token for them
      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Create a custom token for this user with timeout
      try {
        console.log('Creating custom token for user:', uid);
        const tokenPromise = auth.createCustomToken(uid);
        const token = (await Promise.race([
          tokenPromise,
          timeoutPromise,
        ])) as string;
        console.log('Custom token created successfully');

        return NextResponse.json({
          token,
          user: {
            uid,
            walletAddress: userData.walletAddress,
            userType: userData.userType,
            name: userData.name,
          },
          message: 'Sign in successful!',
        });
      } catch (tokenError) {
        console.error('Error creating custom token:', tokenError);

        // Return a specific error for token creation failures
        return NextResponse.json(
          {
            error: 'TOKEN_CREATION_ERROR',
            message:
              'Unable to create authentication token. Please try again later.',
          },
          { status: 500 }
        );
      }
    } catch (authError) {
      console.error('Firestore authentication error:', authError);

      // Log more detailed error information
      if (authError instanceof Error) {
        console.error('Error message:', authError.message);
        console.error('Error stack:', authError.stack);

        // Log additional properties that might be available
        const anyError = authError as any;
        if (anyError.code) console.error('Error code:', anyError.code);
        if (anyError.details) console.error('Error details:', anyError.details);
      }

      // Check for timeout errors
      if (
        authError instanceof Error &&
        authError.message === 'Request timeout'
      ) {
        return NextResponse.json(
          {
            error: 'TIMEOUT_ERROR',
            message: 'Database operation timed out. Please try again later.',
          },
          { status: 504 }
        );
      }

      // Check for authentication errors
      if (
        authError instanceof Error &&
        (authError.message.includes('UNAUTHENTICATED') ||
          authError.message.includes('authentication credentials'))
      ) {
        return NextResponse.json(
          {
            error: 'FIREBASE_AUTH_ERROR',
            message: 'Firebase authentication error. Please try again later.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'AUTHENTICATION_ERROR',
          message:
            'Unable to authenticate with the database. Please try again later.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';
    console.error('Login error details:', errorMessage);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return NextResponse.json(
          {
            error: 'TIMEOUT_ERROR',
            message: 'Request timed out. Please try again later.',
          },
          { status: 504 }
        );
      } else if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'CONNECTION_ABORTED',
            message: 'Connection aborted. Please try again later.',
          },
          { status: 503 }
        );
      }
    }

    // Provide a user-friendly error message
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_FAILED',
        message:
          'An error occurred during authentication. Please try again later.',
      },
      { status: 500 }
    );
  }
}
