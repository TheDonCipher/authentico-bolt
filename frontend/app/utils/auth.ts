export const handleWalletAuth = async (account: any, router: any) => {
  try {
    if (!account) {
      return {
        error: 'Please connect your wallet before signing in.',
        user: null,
      };
    }

    const response = await fetch(`/api/user/${account.address}`);
    const data = await response.json();

    if (response.ok) {
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
