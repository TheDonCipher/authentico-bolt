import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`http://user-service:3003/user/${walletAddress}`);
    
    if (response.ok) {
      const user = await response.json();
      return NextResponse.json(user);
    } else if (response.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'An error occurred' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
