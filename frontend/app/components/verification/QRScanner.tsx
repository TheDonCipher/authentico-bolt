'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Note: We're using a simplified QR scanner approach since react-qr-reader has compatibility issues
// In a production app, you would use a proper QR scanner library with camera access

const QRScanner = () => {
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = () => {
    try {
      // Validate the input as a URL
      const url = new URL(qrValue);
      
      // Check if it's a verification URL
      if (url.pathname.startsWith('/verify/')) {
        // Extract the document ID from the URL
        const docId = url.pathname.split('/verify/')[1];
        
        if (docId) {
          // Navigate to the verification page
          router.push(`/verify/${docId}`);
        } else {
          setError('Invalid verification URL');
        }
      } else {
        setError('Not a valid verification URL');
      }
    } catch (err) {
      setError('Please enter a valid URL');
    }
  };

  return (
    <div className="bg-white p-6 border-4 border-[#556B2F] shadow-brutal">
      <h2 className="text-xl font-bold mb-4">Verify Document</h2>
      
      <p className="mb-4 text-sm text-gray-600">
        Enter a verification URL or paste a QR code value to verify a document.
      </p>
      
      <div className="mb-4">
        <input
          type="text"
          value={qrValue}
          onChange={(e) => {
            setQrValue(e.target.value);
            setError(null);
          }}
          placeholder="https://example.com/verify/123456"
          className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
        />
        {error && <p className="mt-1 text-red-600 text-sm">{error}</p>}
      </div>
      
      <button
        onClick={handleScan}
        className="w-full bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
      >
        Verify
      </button>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Note: For enhanced security, scan QR codes directly from official documents or trusted sources.
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
