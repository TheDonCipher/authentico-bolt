'use client';

import React from 'react';
import Link from 'next/link';
import QRScanner from '../components/verification/QRScanner';
import { FileCheck, Shield, Lock } from 'lucide-react';

const VerificationPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col font-archivo">
      {/* Header */}
      <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block">
            AUTHENTICO
          </Link>
          <nav>
            <Link href="/" className="font-bold hover:underline">
              Home
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-[#2F4F4F]">
              Document Verification
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              Verify the authenticity of documents using our blockchain-powered verification system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <QRScanner />
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <div className="flex items-center mb-4">
                  <FileCheck className="mr-3 text-[#556B2F]" size={24} />
                  <h3 className="text-xl font-bold">How It Works</h3>
                </div>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Scan the QR code on the document</li>
                  <li>Enter the verification URL</li>
                  <li>View the document's verification status</li>
                  <li>Check the blockchain record for tamper-proof verification</li>
                </ol>
              </div>
              
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <div className="flex items-center mb-4">
                  <Shield className="mr-3 text-[#556B2F]" size={24} />
                  <h3 className="text-xl font-bold">Security Features</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Lock className="mr-2 mt-1 text-[#556B2F]" size={16} />
                    <span>Blockchain-anchored verification</span>
                  </li>
                  <li className="flex items-start">
                    <Lock className="mr-2 mt-1 text-[#556B2F]" size={16} />
                    <span>Tamper-proof document hashing</span>
                  </li>
                  <li className="flex items-start">
                    <Lock className="mr-2 mt-1 text-[#556B2F]" size={16} />
                    <span>Verified by trusted organizations</span>
                  </li>
                  <li className="flex items-start">
                    <Lock className="mr-2 mt-1 text-[#556B2F]" size={16} />
                    <span>End-to-end encryption</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#E8EDE1] border-t-4 border-[#556B2F] py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <p className="text-sm text-[#2F4F4F]">
            &copy; {new Date().getFullYear()} Authentico. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VerificationPage;
