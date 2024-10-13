/* eslint-disable */
'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Database, Key, FileText, Cpu, Github, Linkedin, Twitter } from 'lucide-react';
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "./client";
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-indigo-900 p-4 sticky top-0 z-10 border-b-8 border-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-black mb-4 md:mb-0">AUTHENTICO</h1>
          <nav className="w-full md:w-auto">
            <ul className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4 items-center">
              
              {account && (
                <li className="mb-2 md:mb-0">
                  <Link href="/dashboard" className="hover:bg-indigo-700 transition duration-300 p-2 border-4 border-white block">
                    Dashboard
                  </Link>
                </li>
              )}
              <li className="mb-2 md:mb-0">
                <div className="px-2 py-2">
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
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight bg-indigo-800 p-4 border-8 border-white inline-block transform -rotate-2">
            SECURE DOCUMENT<br />VERIFICATION
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-2xl mx-auto bg-gray-800 p-4 border-4 border-white transform rotate-1">
            Authentico leverages cutting-edge blockchain technology to provide tamper-proof document authentication.
          </p>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <h3 className="text-3xl md:text-4xl font-black mb-8 text-center bg-indigo-800 p-4 border-8 border-white inline-block transform rotate-2">FEATURES</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield size={48} />}
              title="SECURE VERIFICATION"
              description="Tamper-proof document authentication using blockchain technology"
              color="bg-indigo-800"
            />
            <FeatureCard 
              icon={<Database size={48} />}
              title="DECENTRALIZED STORAGE"
              description="Enhanced security with IPFS decentralized storage"
              color="bg-indigo-700"
            />
            <FeatureCard 
              icon={<Key size={48} />}
              title="PRIVACY-FIRST"
              description="Zero-knowledge proofs ensure data privacy during verification"
              color="bg-indigo-600"
            />
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="mb-20">
          <h3 className="text-3xl md:text-4xl font-black mb-8 text-center bg-indigo-800 p-4 border-8 border-white inline-block transform -rotate-2">ABOUT US</h3>
          <div className="bg-gray-800 p-6 border-8 border-white">
            <p className="text-lg mb-4">
              Authentico is at the forefront of blockchain-based document verification. Our mission is to provide a secure, transparent, and efficient solution for document authentication in the digital age.
            </p>
            <p className="text-lg">
              Founded by a team of blockchain enthusiasts and cybersecurity experts, we're committed to revolutionizing the way organizations handle sensitive documents.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mb-20">
          <h3 className="text-3xl md:text-4xl font-black mb-8 text-center bg-indigo-800 p-4 border-8 border-white inline-block transform rotate-2">CONTACT US</h3>
          <div className="bg-gray-800 p-6 border-8 border-white">
            <p className="text-lg mb-4">
              {"Have questions or want to learn more about Authentico? Get in touch with us!"}
            </p>
            <p className="text-lg mb-4">
              {"Email: info@authentico.com"}
            </p>
            <p className="text-lg">
              {"Phone: +1 (555) 123-4567"}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-900 p-8 border-t-8 border-white">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-lg mb-4 md:mb-0">&copy; 2023 Authentico. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-gray-300 transition"><Github size={24} /></a>
            <a href="#" className="text-white hover:text-gray-300 transition"><Linkedin size={24} /></a>
            <a href="#" className="text-white hover:text-gray-300 transition"><Twitter size={24} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) => (
  <div className={`${color} p-6 flex flex-col items-center text-center border-8 border-white transform hover:rotate-2 transition-transform duration-300`}>
    <div className="text-white mb-4 bg-gray-800 p-2 border-4 border-white rounded-full">{icon}</div>
    <h3 className="text-xl font-black mb-2">{title}</h3>
    <p className="font-bold">{description}</p>
  </div>
);

export default NeubrutalistLanding;
