'use client';

import React, { useState, useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { DocumentSeal } from './DocumentSeal';
import './documentViewer.css';

interface DocumentViewerProps {
  documentData: string;
  mimeType: string;
  fileName?: string;
  status?: string;
  updatedAt?: string | number | Date;
  fallback?: boolean;
}

export const DocumentViewer = (props: DocumentViewerProps) => {
  const {
    documentData,
    mimeType,
    fileName = 'document',
    status,
    updatedAt,
    fallback,
  } = props;
  const [error, setError] = useState<string | null>(null);
  const [animateStamp, setAnimateStamp] = useState(false);

  // Start animation after component mounts
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      setAnimateStamp(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Validate document data before processing
  useEffect(() => {
    // Skip validation for fallback mode
    if (props.fallback) {
      return;
    }

    if (!documentData) {
      setError('Document data is missing. Please try again later.');
      return;
    }

    // Check if documentData is a valid base64 string
    try {
      // A simple check to see if the string is base64-like
      if (!/^[A-Za-z0-9+/=]+$/.test(documentData)) {
        throw new Error('Invalid document data format');
      }
    } catch (err) {
      console.error('Document data validation error:', err);
      setError(
        'The document data appears to be corrupted. Please try again or contact support.'
      );
    }
  }, [documentData, props.fallback]);

  // Create a blob URL for the document
  const createBlobUrl = () => {
    try {
      if (!documentData) {
        throw new Error('Document data is missing');
      }

      // Convert base64 to binary
      const byteCharacters = atob(documentData);
      const byteArrays: Uint8Array[] = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Error creating blob URL:', err);
      setError(
        'Failed to process document for viewing. ' +
          (err instanceof Error ? err.message : String(err)) +
          ' Please try refreshing the page or contact support if the issue persists.'
      );
      return null;
    }
  };

  const handleDownload = () => {
    const blobUrl = createBlobUrl();
    if (!blobUrl) return;

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  };

  // Determine how to render the document based on MIME type
  const renderDocument = () => {
    if (error) {
      return (
        <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss flex items-start">
          <span className="text-burnt-sienna mr-2 flex-shrink-0 mt-1">
            <AlertCircle size={18} />
          </span>
          <p className="text-deep-moss">{error}</p>
        </div>
      );
    }

    // Handle fallback mode
    if (props.fallback) {
      return (
        <div className="bg-soft-sage bg-opacity-30 p-6 border-2 border-deep-moss text-center relative">
          <p className="text-deep-moss mb-4 font-bold">
            Document Preview Unavailable
          </p>
          <p className="text-deep-moss mb-4">
            The document content cannot be displayed at this time. Please try
            again later or contact support.
          </p>
          <div className="p-4 bg-ivory border border-deep-moss inline-block">
            <p className="text-sm text-deep-moss mb-2">Document Information:</p>
            <p className="text-xs text-gray-600">Name: {fileName}</p>
            <p className="text-xs text-gray-600">Type: {mimeType}</p>
            <p className="text-xs text-gray-600">
              Status: {status || 'Unknown'}
            </p>
          </div>
          {status && (
            <div
              className={`stamp-container ${
                animateStamp ? 'stamp-animation' : 'stamp-animation-initial'
              }`}
            >
              <DocumentSeal
                status={status}
                date={updatedAt}
                size="large"
                className={`${
                  animateStamp
                    ? 'stamp-ink-animation'
                    : 'stamp-ink-animation-initial'
                }`}
              />
            </div>
          )}
        </div>
      );
    }

    const blobUrl = createBlobUrl();
    if (!blobUrl) return null;

    if (mimeType.startsWith('image/')) {
      return (
        <div className="border-2 border-deep-moss bg-white relative">
          <img
            src={blobUrl}
            alt="Document"
            className="max-w-full h-auto mx-auto"
            onLoad={() => URL.revokeObjectURL(blobUrl)}
            onError={() => {
              URL.revokeObjectURL(blobUrl);
              setError('Failed to load image');
            }}
          />
          {status && (
            <div
              className={`stamp-container ${
                animateStamp ? 'stamp-animation' : 'stamp-animation-initial'
              }`}
            >
              <DocumentSeal
                status={status}
                date={updatedAt}
                size="large"
                className={`${
                  animateStamp
                    ? 'stamp-ink-animation'
                    : 'stamp-ink-animation-initial'
                }`}
              />
            </div>
          )}
        </div>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <div className="border-2 border-deep-moss bg-white h-[600px] relative">
          <iframe
            src={blobUrl}
            className="w-full h-full"
            title="PDF Document"
            onLoad={() => {
              // Don't revoke immediately for PDFs as the iframe needs to keep using it
              // We'll rely on component unmount to clean up
            }}
            onError={() => {
              URL.revokeObjectURL(blobUrl);
              setError('Failed to load PDF');
            }}
          />
          {status && (
            <div
              className={`stamp-container ${
                animateStamp ? 'stamp-animation' : 'stamp-animation-initial'
              }`}
            >
              <DocumentSeal
                status={status}
                date={updatedAt}
                size="large"
                className={`${
                  animateStamp
                    ? 'stamp-ink-animation'
                    : 'stamp-ink-animation-initial'
                }`}
              />
            </div>
          )}
        </div>
      );
    } else {
      // For other file types, just show a download button
      URL.revokeObjectURL(blobUrl); // Clean up since we're not using it for display
      return (
        <div className="bg-ivory p-6 border-2 border-deep-moss text-center relative">
          <p className="text-deep-moss mb-4">
            This document type ({mimeType}) cannot be previewed directly.
          </p>
          <button
            onClick={handleDownload}
            className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all inline-flex items-center"
          >
            <span className="inline-flex items-center">
              <Download size={18} className="mr-2" />
              Download Document
            </span>
          </button>
          {status && (
            <div
              className={`stamp-container ${
                animateStamp ? 'stamp-animation' : 'stamp-animation-initial'
              }`}
            >
              <DocumentSeal
                status={status}
                date={updatedAt}
                size="large"
                className={`${
                  animateStamp
                    ? 'stamp-ink-animation'
                    : 'stamp-ink-animation-initial'
                }`}
              />
            </div>
          )}
        </div>
      );
    }
  };

  // Clean up blob URLs when component unmounts
  React.useEffect(() => {
    return () => {
      // This is a best-effort cleanup
      // Any blob URLs created during the component's lifecycle should be revoked
    };
  }, []);

  return (
    <div className="w-full">
      {renderDocument()}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleDownload}
          className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all inline-flex items-center"
        >
          <span className="inline-flex items-center">
            <Download size={18} className="mr-2" />
            Download
          </span>
        </button>
      </div>
    </div>
  );
};
