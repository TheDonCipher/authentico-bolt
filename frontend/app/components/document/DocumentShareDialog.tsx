'use client';

import React, { useState } from 'react';
import { X, Copy, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Toast } from '../ui/Toast';

interface DocumentShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | number;
  documentName: string;
  documentStatus?: string; // Optional status to check if document is verified
}

export const DocumentShareDialog = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  documentStatus = 'Verified', // Default to verified if not provided
}: DocumentShareDialogProps) => {
  // Check if document is verified
  const isVerified = documentStatus === 'Verified' || documentStatus === '2';
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const verificationUrl = `${window.location.origin}/verify/${documentId}`;

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setToastMessage({
          type: 'success',
          message,
        });

        // Clear toast after 3 seconds
        setTimeout(() => setToastMessage(null), 3000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        setToastMessage({
          type: 'error',
          message: 'Failed to copy to clipboard',
        });
      }
    );
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById(
      'qr-code-canvas'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${documentName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}_verification_qr.png`;
    link.href = url;
    link.click();
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the background overlay was clicked directly
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackgroundClick}
    >
      <div className="bg-ivory border-4 border-deep-moss p-6 max-w-md w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-ivory z-10">
          <h2 className="text-2xl font-bold text-deep-moss">
            Share Document Verification
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-soft-sage rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-soft-sage border-2 border-deep-moss p-4 mb-6">
          {!isVerified && (
            <div className="mb-4 p-2 bg-burnt-sienna bg-opacity-20 border border-deep-moss">
              <p className="text-deep-moss text-sm font-medium">
                Warning: This document has not been verified yet. The
                verification link will show the current status of your document.
              </p>
            </div>
          )}
          <p className="text-deep-moss mb-4">
            Share this verification link or QR code to allow others to verify
            the authenticity of your document.
          </p>
          <div className="flex items-center mb-4">
            <input
              type="text"
              value={verificationUrl}
              readOnly
              className="w-full p-2 border-2 border-deep-moss focus:outline-none"
            />
            <button
              onClick={() =>
                copyToClipboard(
                  verificationUrl,
                  'Verification link copied to clipboard!'
                )
              }
              className="ml-2 p-2 bg-soft-sage border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              title="Copy to clipboard"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-4 border-2 border-deep-moss mb-4">
            <QRCodeSVG
              id="qr-code-canvas"
              value={verificationUrl}
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={downloadQRCode}
              className="flex items-center bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              <Download size={18} className="mr-2" />
              Download QR
            </button>
            <button
              onClick={() =>
                copyToClipboard(
                  verificationUrl,
                  'Verification link copied to clipboard!'
                )
              }
              className="flex items-center bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              <Share2 size={18} className="mr-2" />
              Copy Link
            </button>
          </div>
        </div>

        <div className="bg-soft-sage border-2 border-deep-moss p-4">
          <h3 className="font-bold text-deep-moss mb-2">How It Works</h3>
          <p className="text-deep-moss text-sm">
            When someone scans this QR code or visits the link, they will see
            the verification status of your document on the blockchain,
            confirming its authenticity without revealing the actual document
            content.
          </p>
        </div>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        </div>
      )}
    </div>
  );
};
