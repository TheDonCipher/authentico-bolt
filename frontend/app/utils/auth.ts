export const handleWalletAuth = async (account: any, router: any) => {
  try {
    if (!account) {
      console.log('No account found. Redirecting to login.');
      router.push('/login');
      return {
        error: 'Please connect your wallet before signing in.',
        user: null,
      };
    }

    console.log('Account found:', account);
    const { address, balance } = account;
    console.log('Account address:', address);
    console.log('Account balance:', balance);
    // Use environment variable for API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    console.log('API URL:', apiUrl);

    const response = await fetch(`${apiUrl}`);
    console.log('Response from fetch:', response);
    const data = await response.json();
    console.log('Data from fetch:', data);

    if (response.ok && data.walletAddress == account.address) {
      return { user: data, error: null };
    } else if (response.status === 404) {
      return {
        error: 'User not found. Please sign up first.',
        user: null,
      };
    } else {
      return {
        error: 'An error occurred while signing in.',
        user: null,
      };
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      error: 'An error occurred while signing in. Please try again.',
      user: null,
    };
  }
};
