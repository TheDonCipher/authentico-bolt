import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://user-service:3003/user/signup/individual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (response.ok) {
      const user = await response.json();
      return NextResponse.json(user);
    } else {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Failed to sign up' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error signing up individual:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}