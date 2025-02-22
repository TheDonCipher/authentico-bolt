import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="bg-[#2C3E50] text-white py-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h4 className="text-xl font-bold mb-2">Authentico</h4>
          <p>Secure Document Verification</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="#"
            className="hover:text-[#4A6741] transition duration-300"
          >
            <Github size={24} />
          </Link>
          <Link
            href="#"
            className="hover:text-[#4A6741] transition duration-300"
          >
            <Linkedin size={24} />
          </Link>
          <Link
            href="#"
            className="hover:text-[#4A6741] transition duration-300"
          >
            <Twitter size={24} />
          </Link>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p>
          &copy; {new Date().getFullYear()} Authentico. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
