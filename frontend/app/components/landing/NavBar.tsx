import React from 'react';
import { HamburgerMenu } from '../landing/HamburgerMenu';

interface INavbar {
  toogleShow: () => void;
  openForm: any;
}

export const NavBar = ({ toogleShow, openForm }: INavbar) => {
  return (
    <nav className="fixed top-0 z-40 w-full bg-ivory px-4 py-3 md:py-4 border-b-4 border-deep-moss shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex-shrink-0">
          <button className="font-black text-xl md:text-2xl bg-soft-sage px-3 py-1 md:px-4 md:py-2 border-2 md:border-4 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all">
            AUTHENTICO
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <a
            href="#home"
            className="font-bold text-deep-moss hover:text-forest-green transition-colors"
          >
            Home
          </a>
          <a
            href="#guide"
            className="font-bold text-deep-moss hover:text-forest-green transition-colors"
          >
            Guide
          </a>
          <a
            href="#features"
            className="font-bold text-deep-moss hover:text-forest-green transition-colors"
          >
            Features
          </a>
          <a
            href="#faq"
            className="font-bold text-deep-moss hover:text-forest-green transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={toogleShow}
            className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all"
          >
            Connect Wallet
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center md:hidden">
          <button
            onClick={toogleShow}
            className="mr-4 bg-forest-green text-ivory px-3 py-1 text-sm font-bold border-2 border-deep-moss shadow-[3px_3px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all"
          >
            Connect
          </button>
          <HamburgerMenu />
        </div>
      </div>
    </nav>
  );
};
