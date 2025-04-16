import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
interface PersonalSignUpProps {
  closeSignup: () => void;
  showIndSignUp: boolean;
}

export const PersonalSignUp: React.FC<PersonalSignUpProps> = ({
  closeSignup,
  showIndSignUp,
}) => {
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    walletAddress: '',
    role: '0',
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [account, setAccount] = React.useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  const [name, setName] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<string | null>(null);
  useEffect(() => {
    const initializeWallet = async () => {
      console.log('------window.ethereum-----', window.ethereum);
      await window.ethereum.enable();

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send('eth_requestAccounts', []);
      console.log('------provider-----', provider);
      console.log('---fetching network details----');
      const network = await provider.getNetwork();
      if (!network.ensAddress) {
        console.warn('Network does not support ENS');
      }

      const signer = provider.getSigner();
      console.log('------signer-----', signer);
      const account = await signer.getAddress();
      console.log('------account-----', account);

      setAccount(account);
      setFormData((prev) => ({ ...prev, walletAddress: account }));

      setIsWalletConnected(true);
    };

    initializeWallet();
  }, []);

  const handleSetName = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Name changed:', value);

    setName(value);
    console.log('Name set in state:', name);
    setFormData((prev) => ({ ...prev, name: value }));
    console.log;
  };

  const handleSetEmail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Email changed:', value);

    setEmail(value);
    console.log('Email set in state:', email);
    setFormData((prev) => ({ ...prev, email: value }));
  };
  const handleSetPassword = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log('Password changed:', value);

    setPassword(value);
    console.log('Password set in state:', password);
    setFormData((prev) => ({ ...prev, password: value }));
  };

  const [showPassword, setShowPassword] = React.useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted:', formData);
    console.log('Account:', account);
    console.log('Name:', name);
    console.log('Email:', email);

    setFormData({
      name: name,
      email: email,
      password: password,
      walletAddress: account,
      role: '0',
    });

    console.log('data set in formdat object ', formData);
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (error) {
      setError('Please fix the errors above.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    setFormData({
      name: name,
      email: email,
      password: password,
      walletAddress: account,
      role: '0',
    });

    console.log('Form data:', formData);
    console.log('Submitting form...');
    console.log('Submitting form data:', formData);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      console.log('Response:', response);
      console.log('Response body:', await response.json());

      if (!response.ok) {
        throw new Error('Failed to sign up. Please try again.');
      }

      const data = await response.json();
      setSuccess(
        'Sign-up successful! Please check your email for verification.'
      );
      setFormData({
        name: '',
        email: '',
        password: '',
        walletAddress: '',
        role: '0',
      });

      router.push('/individul-dashboard');
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle form submission
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
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              onChange={(e) => handleSetName(e)}
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
              onChange={(e) => handleSetEmail(e)}
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
              onChange={(e) => handleSetPassword(e)}
            />
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300"
          >
            Sign Up
          </button>
        </form>
      </motion.section>
    </motion.div>
  );
};
