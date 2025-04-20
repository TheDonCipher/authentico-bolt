'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <div className="bg-burnt-sienna bg-opacity-20 border-4 border-deep-moss p-8 shadow-brutal max-w-md w-full text-center transform rotate-1">
          <div className="flex justify-center mb-6">
            <div className="bg-ivory p-4 rounded-full border-4 border-deep-moss transform -rotate-2">
              <AlertTriangle size={64} className="text-burnt-sienna" />
            </div>
          </div>

          <h1 className="text-3xl font-black mb-4 text-deep-moss">
            Something Went Wrong
          </h1>

          <p className="text-lg mb-6 text-deep-moss">
            We encountered an error while processing your request.
          </p>

          <div className="bg-ivory p-4 border-2 border-deep-moss mb-6 text-left">
            <p className="font-mono text-sm text-deep-moss overflow-auto max-h-32">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-forest-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-ivory text-deep-moss px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              <Home size={20} />
              <span>Go to Home Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
