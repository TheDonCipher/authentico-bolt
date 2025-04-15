import React, { useState } from 'react';
// Router is handled by AuthContext
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';
import { AnimatePresence } from 'framer-motion';
import { NeubrutalistLoading } from '../ui/NeubrutalistLoading';

interface RegisterFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onCancel,
  onSuccess,
}) => {
  const [userType, setUserType] = useState<'individual' | 'organization'>(
    'individual'
  );
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const account = useActiveAccount();
  const { register, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      setFormError('Please connect your wallet first');
      setToastMessage({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    if (!name) {
      setFormError('Name is required');
      setToastMessage({ type: 'error', message: 'Name is required' });
      return;
    }

    if (userType === 'organization' && !organizationName) {
      setFormError('Organization name is required');
      setToastMessage({
        type: 'error',
        message: 'Organization name is required',
      });
      return;
    }

    try {
      setIsLoading(true);
      setFormError(null);

      const userData = {
        name,
        ...(userType === 'organization' && { organizationName }),
      };

      // Show wallet address being used for registration
      setToastMessage({
        type: 'success',
        message: `Creating account with wallet: ${account.address.slice(
          0,
          6
        )}...${account.address.slice(-4)}`,
      });

      const result = await register(account.address, userType, userData);

      if (result.success) {
        // Success message
        setToastMessage({
          type: 'success',
          message:
            result.message ||
            'Registration successful! Redirecting to dashboard...',
        });

        if (onSuccess) {
          onSuccess();
        }
        // Redirect will happen automatically via AuthContext
      }
    } catch (err: any) {
      setFormError(err.message || 'Registration failed');
      setToastMessage({
        type: 'error',
        message: err.message || 'Registration failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show full-screen loading when registering
  if (isLoading) {
    return (
      <NeubrutalistLoading message="Creating Your Account" fullScreen={true} />
    );
  }

  return (
    <div className="bg-white p-6 border-4 border-[#556B2F] shadow-[8px_8px_0px_0px_rgba(85,107,47,1)] max-w-md w-full transform rotate-1">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#2C3E50] transform -rotate-2">
        Create Your Account
      </h2>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}
      </AnimatePresence>

      {(formError || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError || error}
        </div>
      )}

      {/* Connected Wallet Display */}
      {account && (
        <div className="mb-6 p-3 bg-[#E8EDE1] border-2 border-[#556B2F] rounded">
          <p className="text-sm font-medium text-[#2F4F4F]">
            Connected Wallet:
          </p>
          <p className="font-mono text-sm truncate">{account.address}</p>
          <div className="mt-2 p-2 bg-[#D2E3C8] border border-[#556B2F] rounded">
            <p className="text-xs font-medium text-[#2F4F4F]">
              <span className="font-bold">Important:</span> This wallet address
              will be linked to your account. You will need to use this same
              wallet to sign in later.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUserType('individual')}
              className={`flex-1 py-2 px-4 rounded-md border ${
                userType === 'individual'
                  ? 'bg-[#4A6741] text-white border-[#4A6741]'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setUserType('organization')}
              className={`flex-1 py-2 px-4 rounded-md border ${
                userType === 'organization'
                  ? 'bg-[#4A6741] text-white border-[#4A6741]'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Organization
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {userType === 'individual' ? 'Full Name' : 'Contact Person Name'}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
            required
          />
        </div>

        {userType === 'organization' && (
          <div>
            <label
              htmlFor="organizationName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Organization Name
            </label>
            <input
              type="text"
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-2 px-4 bg-[#4A6741] text-white rounded-md border-2 border-[#2C3E50] hover:bg-[#5D8C5D] flex items-center justify-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                <span>Registering...</span>
              </>
            ) : (
              'Register'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          By registering, you agree to Authentico's Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
};
