import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="bg-deep-moss text-ivory py-8 mt-auto">
    <div className="container mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        <div className="text-center md:text-left">
          <h4 className="text-xl font-black mb-3 inline-block bg-forest-green px-3 py-1 border-2 border-ivory">
            AUTHENTICO
          </h4>
          <p className="mt-2">Secure Document Verification</p>
        </div>

        <div className="text-center">
          <h5 className="font-bold mb-3">Quick Links</h5>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-soft-sage transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-soft-sage transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-soft-sage transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-soft-sage transition-colors">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div className="text-center md:text-right">
          <h5 className="font-bold mb-3">Connect With Us</h5>
          <div className="flex justify-center md:justify-end space-x-4">
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2"
              aria-label="GitHub"
            >
              <Github size={24} />
            </Link>
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </Link>
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2"
              aria-label="Twitter"
            >
              <Twitter size={24} />
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-forest-green text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} Authentico. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
