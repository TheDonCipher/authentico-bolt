/**
 * Utility functions for document verification
 */

/**
 * Generate a verification URL for a document
 * @param documentId The document ID to verify
 * @returns The full verification URL
 */
export const getVerificationUrl = (documentId: string | number): string => {
  // Use window.location.origin to get the base URL in the browser
  // or fallback to a relative path if running on the server
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  
  return `${baseUrl}/verify/${documentId}`;
};

/**
 * Check if a document is verified
 * @param doc The document object
 * @returns True if the document is verified
 */
export const isDocumentVerified = (doc: any): boolean => {
  if (!doc) return false;
  
  const status = doc.status?.toLowerCase?.() || '';
  return (
    status === 'verified' || 
    status === '0' || 
    status === '2'
  );
};
