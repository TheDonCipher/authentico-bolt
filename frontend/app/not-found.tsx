'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
// import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col p-4">
      {/* Header */}
      <header className="bg-soft-sage p-4 border-b-4 border-deep-moss mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-black text-deep-moss transform -rotate-2 bg-ivory p-2 border-4 border-deep-moss inline-block"
          >
            AUTHENTICO
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-soft-sage border-4 border-deep-moss p-8 shadow-brutal text-center relative overflow-hidden">
            {/* 404 background text */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-[20rem] font-black text-deep-moss leading-none">
                404
              </span>
            </div>

            <div className="relative z-10">
              <div className="inline-block bg-burnt-sienna bg-opacity-20 p-4 border-4 border-deep-moss transform -rotate-2 mb-6">
                <h1 className="text-4xl md:text-6xl font-black text-deep-moss">
                  Page Not Found
                </h1>
              </div>

              <p className="text-xl mb-8 text-deep-moss">
                We couldn't find the page you're looking for. It might have been
                moved, deleted, or never existed.
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 bg-forest-green text-ivory px-6 py-3 font-bold border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  <Home size={20} />
                  <span>Go to Home Page</span>
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center gap-2 bg-ivory text-deep-moss px-6 py-3 font-bold border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  <ArrowLeft size={20} />
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="w-20 h-20 bg-sap-green border-4 border-deep-moss absolute -bottom-10 -left-10 transform rotate-12 shadow-brutal hidden md:block" />

          <div className="w-16 h-16 bg-sunflower border-4 border-deep-moss absolute -top-8 -right-8 transform -rotate-12 shadow-brutal hidden md:block" />
        </div>
      </div>
    </div>
  );
}
