'use client';

import React, { useState } from 'react';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';

interface DocumentVerificationProps {
  request: any;
  onVerificationComplete: () => void;
}

export const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  request,
  onVerificationComplete,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.post(
        `/api/documents/${request.documentId}/verify`,
        {
          status: 'Verified',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onVerificationComplete();
    } catch (error: any) {
      console.error('Error verifying document:', error);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to verify document'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setIsRejecting(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.post(
        `/api/documents/${request.documentId}/verify`,
        {
          status: 'Rejected',
          rejectionReason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowRejectionForm(false);
      onVerificationComplete();
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to reject document'
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleViewDocument = () => {
    // Implement document viewing logic
    window.open(`/documents/${request.documentId}`, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {error && (
        <div className="w-full bg-burnt-sienna bg-opacity-20 p-2 border border-deep-moss mb-2 flex items-center">
          <AlertTriangle size={16} className="mr-2 text-burnt-sienna" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {showRejectionForm ? (
        <div className="w-full">
          <div className="mb-2">
            <label htmlFor="rejectionReason" className="block text-xs mb-1 font-bold">
              Reason for Rejection:
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border border-deep-moss text-xs"
              rows={2}
              disabled={isRejecting}
              placeholder="Please provide a reason for rejection"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-burnt-sienna text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setShowRejectionForm(false)}
              disabled={isRejecting}
              className="bg-soft-sage px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleViewDocument}
            className="bg-soft-sage px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
          >
            <Eye size={12} className="mr-1" /> View
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="bg-forest-green text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isVerifying ? 'Verifying...' : <><Check size={12} className="mr-1" /> Verify</>}
          </button>
          <button
            onClick={() => setShowRejectionForm(true)}
            className="bg-burnt-sienna bg-opacity-20 px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
          >
            <X size={12} className="mr-1" /> Reject
          </button>
        </>
      )}
    </div>
  );
};

export default DocumentVerification;
