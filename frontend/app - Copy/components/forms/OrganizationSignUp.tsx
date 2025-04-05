import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface OrganizationSignUpProps {
  orgDetails: {
    orgName: string;
    email: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  closeSignup: () => void;
}

export const OrganizationSignUp: React.FC<OrganizationSignUpProps> = ({
  orgDetails,
  handleInputChange,
  isLoading,
  closeSignup,
}) => {
  const router = useRouter();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeSignup}
    >
      <motion.section
        id="orgSignUpForm"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-2xl font-bold text-[#2C3E50]">
            Organization Sign-Up
          </h4>
          <button
            onClick={closeSignup}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-center mb-6 text-gray-600">
          Complete the form below to sign up as an organization.
        </p>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="orgName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Organization Name
            </label>
            <input
              type="text"
              id="orgName"
              name="orgName"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              value={orgDetails.orgName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              value={orgDetails.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
            onClick={() => router.push('/organization-dashboard')}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      </motion.section>
    </motion.div>
  );
};
