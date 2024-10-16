/* eslint-disable */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Database, Key, Github, Linkedin, Twitter, ChevronDown } from 'lucide-react';
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "./client";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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

  React.useEffect(() => {
    if (account) {
      router.push('/dashboard');
    }
  }, [account, router]);

  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="bg-[#4A6741] p-4 sticky top-0 z-20 border-b-8 border-[#2C3E50]"
        >
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-black text-white">AUTHENTICO</h1>
            <nav>
              <ul className="flex space-x-4 items-center">
                {account && (
                  <li>
                    <Link href="/dashboard" className="hover:bg-[#5D8C5D] transition duration-300 p-2 border-4 border-white text-white font-bold">
                      Dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <ConnectButton
                    client={client}
                    wallets={wallets}
                    theme={darkTheme({
                      colors: {
                        accentText: "#ffffff", 
                        accentButtonBg: "#4A6741",
                        primaryButtonBg: "#5D8C5D",
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
                </li>
              </ul>
            </nav>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-12">
          {/* Hero Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight bg-[#4A6741] text-white p-6 border-8 border-[#2C3E50] inline-block transform -rotate-2">
              SECURE DOCUMENT<br />VERIFICATION
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto bg-[#E5DCC3] p-4 border-4 border-[#2C3E50] transform rotate-1">
              Authentico leverages cutting-edge blockchain technology to provide tamper-proof document authentication.
            </p>
            <motion.a 
              href="#" 
              className="bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-block transform -rotate-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Verifying Now
            </motion.a>
          </motion.section>

          {/* How It Works Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-20"
          >
            <h3 className="text-4xl font-black mb-12 text-center bg-[#4A6741] text-white p-4 border-8 border-[#2C3E50] inline-block transform rotate-2">HOW IT WORKS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ProcessStep 
                number={1}
                title="Upload Document"
                description="Securely upload your document to our platform"
              />
              <ProcessStep 
                number={2}
                title="Blockchain Verification"
                description="Our system verifies the document using blockchain technology"
              />
              <ProcessStep 
                number={3}
                title="Receive Certificate"
                description="Get a tamper-proof certificate of authenticity"
              />
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            id="features" 
            className="mb-20"
          >
            <h3 className="text-4xl font-black mb-12 text-center bg-[#4A6741] text-white p-4 border-8 border-[#2C3E50] inline-block transform rotate-2">FEATURES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Shield size={48} />}
                title="SECURE VERIFICATION"
                description="Tamper-proof document authentication using blockchain technology"
                color="bg-[#4A6741]"
              />
              <FeatureCard 
                icon={<Database size={48} />}
                title="DECENTRALIZED STORAGE"
                description="Enhanced security with IPFS decentralized storage"
                color="bg-[#5D8C5D]"
              />
              <FeatureCard 
                icon={<Key size={48} />}
                title="PRIVACY-FIRST"
                description="Zero-knowledge proofs ensure data privacy during verification"
                color="bg-[#6FA26F]"
              />
            </div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-20"
          >
            <h3 className="text-4xl font-black mb-12 text-center bg-[#4A6741] text-white p-4 border-8 border-[#2C3E50] inline-block transform -rotate-2">FAQ</h3>
            <div className="space-y-4">
              <FAQItem 
                question="What types of documents can be verified?"
                answer="Authentico can verify a wide range of documents including academic certificates, legal documents, and official records."
              />
              <FAQItem 
                question="How secure is the verification process?"
                answer="Our blockchain-based verification process ensures tamper-proof authentication, making it virtually impossible to forge or alter verified documents."
              />
              <FAQItem 
                question="Can I verify documents from any device?"
                answer="Yes, our platform is accessible from any device with an internet connection, including smartphones, tablets, and computers."
              />
            </div>
          </motion.section>

          {/* Call to Action for Organizations */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mb-20 text-center"
          >
            <h3 className="text-4xl font-black mb-8 bg-[#4A6741] text-white p-4 border-8 border-[#2C3E50] inline-block transform -rotate-2">FOR ORGANIZATIONS</h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Streamline your document verification process and enhance security with Authentico's blockchain-powered platform.
            </p>
            <motion.a 
              href="#" 
              className="bg-[#4A6741] text-white text-xl font-bold py-3 px-6 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 inline-block transform rotate-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Your Organization
            </motion.a>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="bg-[#4A6741] text-white p-8 border-t-8 border-[#2C3E50]">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">About Us</h4>
              <p>Authentico: Revolutionizing document verification with blockchain technology.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul>
                <li><a href="#" className="hover:underline">Home</a></li>
                <li><a href="#" className="hover:underline">Features</a></li>
                <li><a href="#" className="hover:underline">For Organizations</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact Us</h4>
              <p>Email: info@authentico.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-gray-300 transition"><Github size={24} /></a>
                <a href="#" className="hover:text-gray-300 transition"><Linkedin size={24} /></a>
                <a href="#" className="hover:text-gray-300 transition"><Twitter size={24} /></a>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2023 Authentico. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }) => (
  <motion.div 
    className={`${color} p-6 flex flex-col items-center text-center border-8 border-[#2C3E50] transform hover:rotate-2 transition-transform duration-300`}
    whileHover={{ scale: 1.05 }}
  >
    <div className="text-white mb-4 bg-[#2C3E50] p-2 border-4 border-white rounded-full">{icon}</div>
    <h3 className="text-xl font-black mb-2 text-white">{title}</h3>
    <p className="font-bold text-white">{description}</p>
  </motion.div>
);

const ProcessStep = ({ number, title, description }) => (
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

const FAQItem = ({ question, answer }) => {
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