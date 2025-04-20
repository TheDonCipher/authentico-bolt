import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="bg-deep-moss text-ivory py-6 sm:py-8 mt-auto">
    <div className="container mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6 sm:mb-8">
        <div className="text-center sm:text-left">
          <h4 className="text-lg sm:text-xl font-black mb-2 sm:mb-3 inline-block bg-forest-green px-2 sm:px-3 py-1 border-2 border-ivory">
            AUTHENTICO
          </h4>
          <p className="mt-2 text-sm sm:text-base">
            Secure Document Verification
          </p>
        </div>

        <div className="text-center">
          <h5 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
            Quick Links
          </h5>
          <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
            <li>
              <a
                href="#"
                className="hover:text-soft-sage transition-colors touch-target inline-block py-1"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-soft-sage transition-colors touch-target inline-block py-1"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-soft-sage transition-colors touch-target inline-block py-1"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-soft-sage transition-colors touch-target inline-block py-1"
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div className="text-center sm:col-span-2 md:col-span-1 md:text-right">
          <h5 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">
            Connect With Us
          </h5>
          <div className="flex justify-center md:justify-end space-x-2 sm:space-x-4">
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2 touch-target"
              aria-label="GitHub"
            >
              <Github size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2 touch-target"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <Link
              href="#"
              className="hover:text-soft-sage transition-colors p-2 touch-target"
              aria-label="Twitter"
            >
              <Twitter size={20} className="sm:w-6 sm:h-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-4 sm:pt-6 border-t border-forest-green text-center text-xs sm:text-sm">
        <p>
          &copy; {new Date().getFullYear()} Authentico. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
