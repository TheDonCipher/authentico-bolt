'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface OrganizationVerificationStatusProps {
  status: string;
  submittedAt?: string | Date;
  notes?: string;
}

const OrganizationVerificationStatus: React.FC<
  OrganizationVerificationStatusProps
> = ({ status, submittedAt, notes }) => {
  const router = useRouter();

  const formatDate = (date: string | Date | any) => {
    if (!date) return 'Unknown';

    try {
      // Handle different types of date inputs
      let dateObj;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Handle Firestore Timestamp
        dateObj = date.toDate();
      } else if (date.seconds) {
        // Handle Firestore Timestamp object format
        dateObj = new Date(date.seconds * 1000);
      } else {
        return 'Invalid date';
      }

      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (status === 'verified') {
    return (
      <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
        <div className="bg-forest-green text-ivory p-3 border-2 border-deep-moss mr-4 mb-4 md:mb-0 transform -rotate-3 shadow-brutal">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-2" />
            <span className="font-black text-lg">VERIFIED</span>
          </div>
        </div>
        <div>
          <p className="text-deep-moss">
            Your organization has been verified and can now verify documents on
            the Authentico platform. When users select your organization during
            document upload, you&apos;ll receive a verification request.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 p-4 mb-4">
        <div className="flex items-center mb-2">
          <Clock className="h-5 w-5 mr-2 text-yellow-600" />
          <h3 className="font-bold text-yellow-800">
            Application Under Review
          </h3>
        </div>
        <p className="text-yellow-800 mb-2">
          Your application is currently being reviewed by our team. We&apos;ll
          notify you once a decision has been made.
        </p>
        {submittedAt && (
          <p className="text-sm text-yellow-700">
            Submitted on: {formatDate(submittedAt)}
          </p>
        )}
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border-2 border-red-200 p-4 mb-4">
        <div className="flex items-center mb-2">
          <XCircle className="h-5 w-5 mr-2 text-red-600" />
          <h3 className="font-bold text-red-800">Application Rejected</h3>
        </div>
        <p className="text-red-800 mb-2">
          Unfortunately, your application has been rejected.
        </p>
        {notes && (
          <div className="mb-2">
            <h4 className="font-bold text-red-800">Reason:</h4>
            <p className="text-red-800">{notes}</p>
          </div>
        )}
        <button
          onClick={() => router.push('/apply/organization')}
          className="mt-4 bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
        >
          Submit New Application
        </button>
      </div>
    );
  }

  // Default: Not verified
  return (
    <>
      <p className="mb-4 text-deep-moss">
        Your organization is not verified yet. Verified organizations can verify
        documents submitted by users. Apply for verification to unlock this
        feature.
      </p>
      <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-deep-moss">Verification Status</p>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              <p className="text-xl font-bold text-amber-500">Not Verified</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/apply/organization')}
            className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            Apply for Verification
          </button>
        </div>
      </div>
    </>
  );
};

export default OrganizationVerificationStatus;
