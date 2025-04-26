import { DOCUMENT_STATUS } from './constants';

/**
 * Normalizes document status to a consistent format
 * @param status The status to normalize
 * @returns Normalized status string ('Verified', 'Rejected', 'Revoked', or 'Pending Verification')
 */
export const normalizeDocumentStatus = (
  status: string | undefined | null
): string => {
  if (!status) return 'Pending Verification';

  const lowerStatus = status.toLowerCase();

  // Handle string status values
  if (lowerStatus === 'verified') return 'Verified';
  if (lowerStatus === 'rejected') return 'Rejected';
  if (lowerStatus === 'revoked') return 'Revoked';
  if (lowerStatus.includes('pending') || lowerStatus === '')
    return 'Pending Verification';

  // Handle numeric status codes (old format)
  if (status === DOCUMENT_STATUS.VERIFIED_CODE) return 'Verified';
  if (status === DOCUMENT_STATUS.REJECTED_CODE) return 'Rejected';
  if (status === DOCUMENT_STATUS.PENDING_CODE) return 'Pending Verification';

  // Return a default status if no match
  return 'Pending Verification';
};

/**
 * Gets the appropriate CSS classes for a document status badge
 * @param status The document status
 * @returns CSS class string for styling the status badge
 */
export const getStatusBadgeClasses = (status: string): string => {
  const normalizedStatus = normalizeDocumentStatus(status);

  switch (normalizedStatus) {
    case 'Verified':
      return 'bg-soft-sage text-forest-green';
    case 'Rejected':
      return 'bg-burnt-sienna bg-opacity-20 text-deep-moss';
    case 'Revoked':
      return 'bg-gray-400 text-gray-800';
    case 'Pending Verification':
    default:
      return 'bg-sunflower bg-opacity-20 text-deep-moss';
  }
};

/**
 * Determines if a document is verified
 * @param status The document status
 * @returns Boolean indicating if the document is verified
 */
export const isDocumentVerified = (
  status: string | undefined | null
): boolean => {
  if (!status) return false;

  const normalizedStatus = normalizeDocumentStatus(status);
  return normalizedStatus === 'Verified';
};

/**
 * Determines if a document is rejected
 * @param status The document status
 * @returns Boolean indicating if the document is rejected
 */
export const isDocumentRejected = (
  status: string | undefined | null
): boolean => {
  if (!status) return false;

  const normalizedStatus = normalizeDocumentStatus(status);
  return normalizedStatus === 'Rejected';
};

/**
 * Determines if a document is pending verification
 * @param status The document status
 * @returns Boolean indicating if the document is pending verification
 */
export const isDocumentPending = (
  status: string | undefined | null
): boolean => {
  if (!status) return true;

  const normalizedStatus = normalizeDocumentStatus(status);
  return normalizedStatus === 'Pending Verification';
};

/**
 * Determines if a document is revoked
 * @param status The document status
 * @returns Boolean indicating if the document is revoked
 */
export const isDocumentRevoked = (
  status: string | undefined | null
): boolean => {
  if (!status) return false;

  const normalizedStatus = normalizeDocumentStatus(status);
  return normalizedStatus === 'Revoked';
};
