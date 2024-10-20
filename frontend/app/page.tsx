/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Database, Key, Github, Linkedin, Twitter, ChevronDown, Upload, Search, Users, Wallet } from 'lucide-react';
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "./client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const wallets = [
  createWallet("io.metamask"),
  inAppWallet({
    auth: {
      options: [
        "email",
        "google",
        "apple",
        "facebook",
        "phone",
      ],
    },
  }),
];

const NeubrutalistLanding = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [showOrgSignUp, setShowOrgSignUp] = useState(false);
  const [showIndSignUp, setShowIndSignUp] = useState(false);
  const [orgDetails, setOrgDetails] = useState({ orgName: '', email: '' });
  const [indDetails, setIndDetails] = useState({ name: '', email: '' });
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showWalletMessage, setShowWalletMessage] = useState(false);

  useEffect(() => {
    const fetchOrCreateUser = async () => {
      if (account) {
        try {
          const response = await fetch(`/api/user/${account.address}`);
          if (response.ok) {
            const user = await response.json();
            setUserType(user.userType);
            if (user.userType === 'organization') {
              router.push('/organization-dashboard');
            } else if (user.userType === 'individual') {
              router.push('/dashboard');
            }
          } else if (response.status === 404) {
            setShowIndSignUp(true);
            setShowOrgSignUp(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          showToast('error', 'An error occurred while fetching user data. Please try again.');
        }
      }
    };

    fetchOrCreateUser();
  }, [account, router]);

  const handleOrganizationSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/signup/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...orgDetails, walletAddress: account?.address }),
      });
      if (response.ok) {
        showToast('success', 'Organization signed up successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/organization-dashboard'), 2000);
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to sign up organization');
      }
    } catch (error) {
      showToast('error', 'An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const handleIndividualSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/signup/individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...indDetails, walletAddress: account?.address }),
      });
      if (response.ok) {
        showToast('success', 'Individual signed up successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to sign up individual');
      }
    } catch (error) {
      showToast('error', 'An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const handleInputChange = <T extends { [key: string]: string }>(e: React.ChangeEvent<HTMLInputElement>, setDetails: React.Dispatch<React.SetStateAction<T>>) => {
    const { name, value } = e.target;
    setDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    if (!account) {
      setAuthError("Please connect your wallet before signing in.");
      setIsSigningIn(false);
      return;
    }
    try {
      const response = await fetch(`/api/user/${account.address}`);
      if (response.ok) {
        const user = await response.json();
        if (user.userType === 'organization') {
          router.push('/organization-dashboard');
        } else if (user.userType === 'individual') {
          router.push('/dashboard');
        }
      } else if (response.status === 404) {
        setAuthError("User not found. Please sign up first.");
      } else {
        setAuthError("An error occurred while signing in. Please try again.");
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError("An error occurred while signing in. Please try again.");
    }
    setIsSigningIn(false);
  };

  const handleSignUp = (type: 'individual' | 'organization') => {
    if (!account) {
      setAuthError("Please connect your wallet before signing up.");
      return;
    }
    if (type === 'individual') {
      setShowIndSignUp(true);
      setShowOrgSignUp(false);
    } else {
      setShowOrgSignUp(true);
      setShowIndSignUp(false);
    }
    setAuthError(null);
  };

  // Function to show wallet connection message
  const handleWalletConnection = () => {
    setShowWalletMessage(true);
    setTimeout(() => {
      setShowWalletMessage(false);
    }, 5000); // Message will disappear after 5 seconds
  };

  // Call this function when the wallet is connected successfully
  useEffect(() => {
    if (account) {
      handleWalletConnection();
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '20px 20px'
      }}></div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Improved Title Section */}
        <div className="bg-[#F0F4F8] p-8 rounded-lg shadow-lg mb-8 w-full">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center text-[#2C3E50]">Welcome to Authentico</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-[#4A6741]">Your Trusted Partner in Secure Document Verification</h2>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-12 space-y-4 md:space-y-0">
          {/* Wallet Connection Instructions */}
          <div className="flex-1 mb-4 md:mb-0 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <p className="font-bold text-lg text-[#1E3A8A]">To use Authentico, please follow these steps:</p>
            <ol className="list-decimal list-inside mt-2 text-left mx-auto max-w-md text-gray-600">
              <li>Connect your wallet using the button below</li>
              <li>Sign in if you're a returning user, or sign up if you're new</li>
            </ol>
            {/* Connect Button moved here */}
            <div className="mt-4">
              <ConnectButton
                client={client}
                wallets={wallets}
                theme={darkTheme({
                  colors: {
                    accentText: "#ffffff", 
                    accentButtonBg: "#4f46e5",
                    primaryButtonBg: "#3730a3",
                  },
                  fontFamily: "Archivo"
                })}
                connectButton={{ label: "Sign In" }}
                connectModal={{
                  size: "wide",
                  welcomeScreen: {
                    title: "Welcome to Authentico",
                    subtitle: "Secure document verification powered by blockchain",
                  },
                }}
              />
            </div>
            {/* User Feedback for Successful Wallet Connection */}
            {account && (
              <div className="mt-4 text-center">
                <p className="text-green-600 font-bold">Wallet connected successfully!</p>
              </div>
            )}

            {/* Sign-in and Sign-up Buttons */}
            <div className="flex flex-col md:flex-row items-start justify-start space-y-4 md:space-y-0 md:space-x-4 mt-4">
              <motion.button 
                onClick={handleSignIn}
                className={`bg-[#4A6741] text-white text-lg md:text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 transform hover:rotate-1 w-full md:w-64 h-16 ${!account ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSigningIn || !account}
              >
                {isSigningIn ? (
                  <>
                    <LoadingSpinner />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Wallet className="inline-block mr-2" />
                    Sign In
                  </>
                )}
              </motion.button>
              <motion.button 
                onClick={() => {
                  setShowIndSignUp(true);
                  setShowOrgSignUp(false);
                  document.getElementById('indSignUpForm')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-[#5D8C5D] text-white text-lg md:text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300 transform hover:rotate-1 w-full md:w-64 h-16 ${!account ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!account}
              >
                Sign Up as Individual
              </motion.button>
              <motion.button 
                onClick={() => {
                  setShowOrgSignUp(true);
                  setShowIndSignUp(false);
                  document.getElementById('orgSignUpForm')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-[#5D8C5D] text-white text-lg md:text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300 transform hover:rotate-1 w-full md:w-64 h-16 ${!account ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!account}
              >
                Sign Up as Organization
              </motion.button>
            </div>
          </div>

          {/* Sign-up forms */}
          <div className="flex-1">
            {showIndSignUp && (
              <motion.section 
                id="indSignUpForm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-20"
              >
                <h4 className="text-2xl font-black mb-4 text-center">Individual Sign-Up</h4>
                <p className="text-center mb-4">Complete the form below to sign up as an individual user.</p>
                <form onSubmit={handleIndividualSignUp} className="max-w-md mx-auto bg-[#E5DCC3] p-8 border-4 border-[#2C3E50]">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-left font-bold mb-2">Name</label>
                    <input type="text" id="name" name="name" className="w-full p-2 border-2 border-[#2C3E50]" value={indDetails.name} onChange={(e) => handleInputChange(e, setIndDetails)} required />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-left font-bold mb-2">Email</label>
                    <input type="email" id="email" name="email" className="w-full p-2 border-2 border-[#2C3E50]" value={indDetails.email} onChange={(e) => handleInputChange(e, setIndDetails)} required />
                  </div>
                  <button 
                    type="submit" 
                    className={`w-full bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </form>
              </motion.section>
            )}

            {showOrgSignUp && (
              <motion.section 
                id="orgSignUpForm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-20"
              >
                <h4 className="text-2xl font-black mb-4 text-center">Organization Sign-Up</h4>
                <p className="text-center mb-4">Complete the form below to sign up as an organization.</p>
                <form onSubmit={handleOrganizationSignUp} className="max-w-md mx-auto bg-[#E5DCC3] p-8 border-4 border-[#2C3E50]">
                  <div className="mb-4">
                    <label htmlFor="orgName" className="block text-left font-bold mb-2">Organization Name</label>
                    <input type="text" id="orgName" name="orgName" className="w-full p-2 border-2 border-[#2C3E50]" value={orgDetails.orgName} onChange={(e) => handleInputChange(e, setOrgDetails)} required />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-left font-bold mb-2">Email</label>
                    <input type="email" id="email" name="email" className="w-full p-2 border-2 border-[#2C3E50]" value={orgDetails.email} onChange={(e) => handleInputChange(e, setOrgDetails)} required />
                  </div>
                  <button 
                    type="submit" 
                    className={`w-full bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </form>
              </motion.section>
            )}
          </div>
        </div>

        {/* Improved Error Message Toast */}
        {authError && (
          <div className="mb-8 text-center">
            <p className="text-red-600 font-bold text-lg">{authError}</p>
          </div>
        )}

        {/* Toast notification with improved styling */}
        <AnimatePresence>
          {toastMessage && (
            <Toast type={toastMessage.type} message={toastMessage.message} />
          )}
        </AnimatePresence>

        {/* How it works section */}
        <section className="mb-20">
          <h3 className="text-3xl font-black mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep number={1} title="Upload" description="Securely upload your documents to our platform." />
            <ProcessStep number={2} title="Verify" description="We verify the authenticity of your documents using blockchain technology." />
            <ProcessStep number={3} title="Access" description="Access your verified documents anytime, anywhere." />
          </div>
        </section>

        {/* Features section */}
        <section className="mb-20">
          <h3 className="text-3xl font-black mb-8 text-center">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Upload size={48} />}
              title="Secure Upload and Verify"
              description="Upload and verify your documents with confidence using our blockchain-powered system."
              color="bg-[#4A6741]"
            />
            <FeatureCard 
              icon={<Database size={48} />}
              title="Intuitive Dashboard"
              description="Manage all your documents effortlessly with our user-friendly dashboard."
              color="bg-[#5D8C5D]"
            />
            <FeatureCard 
              icon={<Search size={48} />}
              title="Advanced Document Lookup"
              description="Find and access your verified documents quickly with our powerful search functionality."
              color="bg-[#4A6741]"
            />
          </div>
        </section>

        {/* For Who section */}
        <section className="mb-20">
          <h3 className="text-3xl font-black mb-8 text-center">Who Is It For?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Users size={48} className="mb-4 text-[#4A6741]" />
              <h4 className="text-xl font-black mb-2">Individuals</h4>
              <p className="font-bold">Securely store and share your personal documents, from certificates to IDs.</p>
            </motion.div>
            <motion.div 
              className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Shield size={48} className="mb-4 text-[#4A6741]" />
              <h4 className="text-xl font-black mb-2">Organizations</h4>
              <p className="font-bold">Streamline document verification processes and enhance security for your institution.</p>
            </motion.div>
          </div>
        </section>

        {/* FAQ section with smoother animations */}
        <section className="mb-20">
          <h3 className="text-3xl font-black mb-8 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <FAQItem 
              question="How secure is Authentico?" 
              answer="Authentico uses advanced blockchain technology to ensure the highest level of security for your documents."
            />
            <FAQItem 
              question="What types of documents can I verify?" 
              answer="You can verify a wide range of documents, including educational certificates, IDs, and official records."
            />
            <FAQItem 
              question="How long does the verification process take?" 
              answer="The verification process is typically completed within 24-48 hours, depending on the complexity of the document."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#2C3E50] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold mb-2">Authentico</h4>
              <p>Secure Document Verification</p>
            </div>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-[#4A6741] transition duration-300">
                <Github size={24} />
              </Link>
              <Link href="#" className="hover:text-[#4A6741] transition duration-300">
                <Linkedin size={24} />
              </Link>
              <Link href="#" className="hover:text-[#4A6741] transition duration-300">
                <Twitter size={24} />
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2023 Authentico. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => (
  <motion.div 
    className={`${color} p-8 flex flex-col items-center text-center border-8 border-[#2C3E50] transform hover:rotate-2 transition-all duration-300 rounded-lg`}
    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
  >
    <div className="text-white mb-6 bg-[#2C3E50] p-4 border-4 border-white rounded-full">{icon}</div>
    <h3 className="text-2xl font-black mb-4 text-white">{title}</h3>
    <p className="font-bold text-white">{description}</p>
  </motion.div>
);

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description }) => (
  <motion.div 
    className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
    whileHover={{ scale: 1.05 }}
  >
    <div className="bg-[#4A6741] text-white text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center mb-4">
      {number}
    </div>
    <h4 className="text-xl font-black mb-2">{title}</h4>
    <p className="font-bold">{description}</p>
  </motion.div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      className="border-4 border-[#2C3E50] bg-[#E5DCC3]"
      initial={false}
      animate={{ backgroundColor: isOpen ? "#F0EAD6" : "#E5DCC3" }}
    >
      <button
        className="w-full text-left p-4 font-bold flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <ChevronDown 
          className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial="collapsed"
        animate={isOpen ? "open" : "collapsed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          collapsed: { opacity: 0, height: 0 }
        }}
        transition={{ duration: 0.3 }}
        className="px-4 pb-4 overflow-hidden"
      >
        <p>{answer}</p>
      </motion.div>
    </motion.div>
  );
};

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Toast: React.FC<{ type: 'success' | 'error'; message: string }> = ({ type, message }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white p-4 rounded-lg shadow-lg z-50`}
  >
    {message}
  </motion.div>
);

export default NeubrutalistLanding;
