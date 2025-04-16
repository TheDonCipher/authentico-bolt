import { Document } from '../../types/dashboard';
import { StatusBadge } from './StatusBadge';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { getDocumentTypeName } from '../../constants/documentTypes';

interface DocumentCardProps {
  doc: Document;
  onShare: (doc: Document) => void;
  onAction: (doc: Document) => void;
}

export const DocumentCard = ({ doc, onShare, onAction }: DocumentCardProps) => {
  const [showQR, setShowQR] = useState(false);

  const verificationUrl = `${window.location.origin}/verify/${doc.documentId}`;

  return (
    <div className="bg-ivory p-4 md:p-6 border-2 md:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-xl">
          {getDocumentTypeName(doc.documentType)}
        </h4>
        <StatusBadge status={doc.status} />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1">
          <p>
            {' '}
            {doc.verifier.slice(0, 5)}... {doc.verifier.slice(-3)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          className="bg-soft-sage px-4 py-2 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold"
          onClick={() => onAction(doc)}
        >
          {doc.status === '1' && 'Check Status'}
          {doc.status === '0' && 'Download'}
          {doc.status === '2' && 'View Reason'}
        </button>

        <button
          type="button"
          className="bg-ivory px-4 py-2 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold"
          onClick={() => setShowQR(true)}
        >
          QR Code
        </button>

        <button
          type="button"
          className="bg-ivory px-4 py-2 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold ml-auto"
          onClick={() => {
            const gatewayUrl = `https://pink-capitalist-rook-863.mypinata.cloud/ipfs/${doc.urlPicture}`;
            const fallbackUrl = `https://ipfs.io/ipfs/${doc.urlPicture}`;
            window.open(fallbackUrl, '_blank').onerror = () => {
              window.open(fallbackUrl, '_blank');
            };
          }}
        >
          Share
        </button>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Verification QR Code</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1 hover:bg-soft-sage rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <QRCodeSVG
                  value={verificationUrl}
                  size={200}
                  bgColor={'#ffffff'}
                  fgColor={'#000000'}
                  level={'H'}
                  includeMargin={false}
                />

                <p className="mt-4 text-center text-sm text-gray-600">
                  Scan this QR code to verify the document's authenticity
                </p>

                <div className="mt-4 w-full">
                  <p className="text-xs text-gray-500 mb-1">
                    Verification URL:
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={verificationUrl}
                      readOnly
                      className="w-full p-2 text-sm border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verificationUrl);
                        alert('Verification URL copied to clipboard!');
                      }}
                      className="ml-2 p-2 bg-soft-sage border border-deep-moss text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
