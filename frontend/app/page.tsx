/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Database, Key, Github, Linkedin, Twitter, ChevronDown } from 'lucide-react';
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "./client";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LoadingSpinner from './components/ui/LoadingSpinner';


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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        }
      }
    };

    fetchOrCreateUser();
  }, [account, router]);

  const handleOrganizationSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const errors = validateForm(orgDetails);
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors).join(', '));
      return;
    }
    if (!account) {
      setErrorMessage('Please connect your wallet before signing up.');
      return;
    }
    try {
      const response = await fetch('/api/user/signup/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...orgDetails, walletAddress: account.address }),
      });
      if (response.ok) {
        setSuccessMessage('Organization signed up successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/organization-dashboard'), 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to sign up organization');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const handleIndividualSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const errors = validateForm(indDetails);
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors).join(', '));
      return;
    }
    if (!account) {
      setErrorMessage('Please connect your wallet before signing up.');
      return;
    }
    try {
      const response = await fetch('/api/user/signup/individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...indDetails, walletAddress: account.address }),
      });
      if (response.ok) {
        setSuccessMessage('Individual signed up successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to sign up individual');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const handleInputChange = <T extends { [key: string]: string }>(e: React.ChangeEvent<HTMLInputElement>, setDetails: React.Dispatch<React.SetStateAction<T>>) => {
    const { name, value } = e.target;
    setDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const validateForm = (details: { [key: string]: string }) => {
    const errors: { [key: string]: string } = {};
    Object.entries(details).forEach(([key, value]) => {
      if (!value.trim()) {
        errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      } else if (key === 'email' && !/\S+@\S+\.\S+/.test(value)) {
        errors[key] = 'Invalid email address';
      }
    });
    return errors;
  };

  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '20px 20px'
      }}></div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-6xl font-black mb-8 text-center">Authentico</h1>
        <h2 className="text-3xl font-bold mb-12 text-center">Secure Document Verification</h2>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="flex justify-center space-x-8 mb-12">
          <button 
            onClick={() => setShowIndSignUp(prev => !prev)}
            className="bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-block transform rotate-1"
          >
            Sign Up as Individual
          </button>
          <button 
            onClick={() => setShowOrgSignUp(prev => !prev)}
            className="bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-block transform rotate-1"
          >
            Sign Up as Organization
          </button>
        </div>

        {showIndSignUp && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h4 className="text-2xl font-black mb-4 text-center">Individual Sign-Up</h4>
            <form onSubmit={handleIndividualSignUp} className="max-w-md mx-auto bg-[#E5DCC3] p-8 border-4 border-[#2C3E50]">
              <div className="mb-4">
                <label htmlFor="name" className="block text-left font-bold mb-2">Name</label>
                <input type="text" id="name" name="name" className="w-full p-2 border-2 border-[#2C3E50]" value={indDetails.name} onChange={(e) => handleInputChange(e, setIndDetails)} required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-left font-bold mb-2">Email</label>
                <input type="email" id="email" name="email" className="w-full p-2 border-2 border-[#2C3E50]" value={indDetails.email} onChange={(e) => handleInputChange(e, setIndDetails)} required />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <ConnectButton
                  client={client}
                  wallets={wallets}
                  theme={darkTheme({
                    colors: {
                      accentText: "#ffffff",
                      primaryButtonText: "#ffffff",
                      accentButtonBg: "#4A6741",
                      primaryButtonBg: "#4A6741",
                    },
                    fontFamily: "Archivo"
                  })}
                  connectButton={{ label: "Connect Blockchain Wallet" }}
                  connectModal={{
                    size: "wide",
                    welcomeScreen: {
                      title: "Welcome to Authentico",
                      subtitle: "Secure document verification powered by blockchain",
                    },
                  }}
                />
                <button 
                  type="submit" 
                  className={`w-full bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Signing Up...
                    </>
                  ) : 'Sign Up'}
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {showOrgSignUp && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-20"
          >
            <h4 className="text-2xl font-black mb-4 text-center">Organization Sign-Up</h4>
            <form onSubmit={handleOrganizationSignUp} className="max-w-md mx-auto bg-[#E5DCC3] p-8 border-4 border-[#2C3E50]">
              <div className="mb-4">
                <label htmlFor="orgName" className="block text-left font-bold mb-2">Organization Name</label>
                <input type="text" id="orgName" name="orgName" className="w-full p-2 border-2 border-[#2C3E50]" value={orgDetails.orgName} onChange={(e) => handleInputChange(e, setOrgDetails)} required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-left font-bold mb-2">Email</label>
                <input type="email" id="email" name="email" className="w-full p-2 border-2 border-[#2C3E50]" value={orgDetails.email} onChange={(e) => handleInputChange(e, setOrgDetails)} required />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <ConnectButton
                  client={client}
                  wallets={wallets}
                  theme={darkTheme({
                    colors: {
                      accentText: "#ffffff",
                      primaryButtonText: "#ffffff",
                      accentButtonBg: "#4A6741",
                      primaryButtonBg: "#4A6741",
                    },
                    fontFamily: "Archivo"
                  })}
                  connectButton={{ label: "Connect Blockchain Wallet" }}
                  connectModal={{
                    size: "wide",
                    welcomeScreen: {
                      title: "Welcome to Authentico",
                      subtitle: "Secure document verification powered by blockchain",
                    },
                  }}
                />
                <button 
                  type="submit" 
                  className={`w-full bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Signing Up...
                    </>
                  ) : 'Sign Up'}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </main>
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
    className={`${color} p-6 flex flex-col items-center text-center border-8 border-[#2C3E50] transform hover:rotate-2 transition-transform duration-300`}
    whileHover={{ scale: 1.05 }}
  >
    <div className="text-white mb-4 bg-[#2C3E50] p-2 border-4 border-white rounded-full">{icon}</div>
    <h3 className="text-xl font-black mb-2 text-white">{title}</h3>
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

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
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

export default NeubrutalistLanding;
