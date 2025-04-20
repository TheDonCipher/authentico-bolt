import { cookies } from 'next/headers';

// Function to set auth token in cookies
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  await cookieStore.set({
    name: 'authToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

// Function to set user data in cookies (for middleware access)
export async function setUserDataCookie(userData: any) {
  const cookieStore = await cookies();
  await cookieStore.set({
    name: 'userData',
    value: JSON.stringify({
      uid: userData.uid,
      userType: userData.userType,
      walletAddress: userData.walletAddress,
      name: userData.name,
    }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

// Function to clear auth cookies
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  await cookieStore.delete('authToken');
  await cookieStore.delete('userData');
}

// Function to get auth token from cookies
export async function getAuthCookie() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('authToken');
  return authCookie?.value;
}

// Function to get user data from cookies
export async function getUserDataCookie() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get('userData')?.value;
  if (userDataCookie) {
    try {
      return JSON.parse(userDataCookie);
    } catch (error) {
      console.error('Error parsing user data cookie:', error);
      return null;
    }
  }
  return null;
}
