'use client';

import React, { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  documentData: string;
  mimeType: string;
  fileName?: string;
}

export const DocumentViewer = ({
  documentData,
  mimeType,
  fileName = 'document',
}: DocumentViewerProps) => {
  const [error, setError] = useState<string | null>(null);

  // Create a blob URL for the document
  const createBlobUrl = () => {
    try {
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
          (err instanceof Error ? err.message : String(err))
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
          <AlertCircle
            className="text-burnt-sienna mr-2 flex-shrink-0 mt-1"
            size={18}
          />
          <p className="text-deep-moss">{error}</p>
        </div>
      );
    }

    const blobUrl = createBlobUrl();
    if (!blobUrl) return null;

    if (mimeType.startsWith('image/')) {
      return (
        <div className="border-2 border-deep-moss bg-white">
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
        </div>
      );
    } else if (mimeType === 'application/pdf') {
      return (
        <div className="border-2 border-deep-moss bg-white h-[600px]">
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
        </div>
      );
    } else {
      // For other file types, just show a download button
      URL.revokeObjectURL(blobUrl); // Clean up since we're not using it for display
      return (
        <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
          <p className="text-deep-moss mb-4">
            This document type ({mimeType}) cannot be previewed directly.
          </p>
          <button
            onClick={handleDownload}
            className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all inline-flex items-center"
          >
            <Download size={18} className="mr-2" />
            Download Document
          </button>
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
          <Download size={18} className="mr-2" />
          Download
        </button>
      </div>
    </div>
  );
};
