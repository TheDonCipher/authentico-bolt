'use client';

import React, { useState } from 'react';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

interface DocumentVerificationProps {
  request: any;
  onVerificationComplete: () => void;
}

const DocumentVerification: React.FC<DocumentVerificationProps> = ({
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

      // Get the document from Firestore first to ensure we have the latest data
      const db = getFirestore();
      const docRef = doc(db, 'documents', request.documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      // Update the document status in Firestore directly
      await updateDoc(docRef, {
        status: 'verified', // Use lowercase for consistency
        verifiedAt: new Date(),
        verifiedBy: request.verifyingOrgId,
      });

      // Also update via API to ensure blockchain anchoring
      await axios.post(
        `/api/documents/${request.documentId}/verify`,
        {
          status: 'verified', // Use lowercase for consistency
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

      // Get the document from Firestore first to ensure we have the latest data
      const db = getFirestore();
      const docRef = doc(db, 'documents', request.documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      // Update the document status in Firestore directly
      await updateDoc(docRef, {
        status: 'rejected', // Use lowercase for consistency
        rejectedAt: new Date(),
        rejectedBy: request.verifyingOrgId,
        rejectionReason: rejectionReason,
      });

      await axios.post(
        `/api/documents/${request.documentId}/verify`,
        {
          status: 'rejected', // Use lowercase for consistency
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

  // Check the document status to determine which actions to show
  const getDocumentStatus = () => {
    if (!request || !request.documentId) return 'pending';

    // Try to get status from different possible fields
    const status = request.status || request.documentStatus;

    // Normalize status to lowercase for consistency
    if (status) {
      if (typeof status === 'string') {
        return status.toLowerCase();
      }
      return status;
    }

    return 'pending';
  };

  const documentStatus = getDocumentStatus();

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
            <label
              htmlFor="rejectionReason"
              className="block text-xs mb-1 font-bold"
            >
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

          {/* Show different buttons based on document status */}
          {documentStatus === 'pending' && (
            <>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="bg-forest-green text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isVerifying ? (
                  'Verifying...'
                ) : (
                  <>
                    <Check size={12} className="mr-1" /> Verify
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRejectionForm(true)}
                className="bg-burnt-sienna bg-opacity-20 px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
              >
                <X size={12} className="mr-1" /> Reject
              </button>
            </>
          )}

          {documentStatus === 'verified' && (
            <button
              onClick={() => setShowRejectionForm(true)}
              className="bg-burnt-sienna bg-opacity-20 px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
            >
              <X size={12} className="mr-1" /> Revoke
            </button>
          )}

          {documentStatus === 'rejected' && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="bg-forest-green text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isVerifying ? (
                'Verifying...'
              ) : (
                <>
                  <Check size={12} className="mr-1" /> Approve
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentVerification;
