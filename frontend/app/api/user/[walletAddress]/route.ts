import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  const walletAddress = params.walletAddress;
  
  try {
    const response = await fetch(`http://user-service:3003/user/${walletAddress}`);
    
    if (response.ok) {
      const user = await response.json();
      return NextResponse.json(user);
    } else if (response.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else {
      return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}