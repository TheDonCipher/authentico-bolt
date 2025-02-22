import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface PersonalSignUpProps {
  closeSignup: () => void;
  showIndSignUp: boolean;
}

export const PersonalSignUp: React.FC<PersonalSignUpProps> = ({
  closeSignup,
  showIndSignUp,
}) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeSignup}
    >
      <motion.section
        id="indSignUpForm"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-2xl font-bold text-[#2C3E50]">
            Individual Sign-Up
          </h4>
          <button
            onClick={closeSignup}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#4A6741] focus:border-[#4A6741]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300"
          >
            Sign Up
          </button>
        </form>
      </motion.section>
    </motion.div>
  );
};
