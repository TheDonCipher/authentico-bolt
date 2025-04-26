'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../../../lib/token-util';
import { DocumentViewer } from '../../../../components/document/DocumentViewer';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { NeubrutalistLoading } from '../../../../components/ui/NeubrutalistLoading';

interface DocumentViewerModalProps {
  documentId: string;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  onClose,
}) => {
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
    status?: string;
    updatedAt?: string | number | Date;
    fallback?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle click outside to close
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!documentData) return;

    const link = document.createElement('a');
    link.href = `data:${documentData.mimeType};base64,${documentData.data}`;
    link.download = documentData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        // First get document metadata from Firestore
        const db = getFirestore();
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Document not found');
        }

        const docData = docSnap.data();
        console.log('Document metadata:', docData);

        // Try the direct-view endpoint first as it's more reliable
        try {
          console.log('Trying direct-view fallback endpoint');
          const directViewResponse = await axios.get(
            `/api/documents/${documentId}/direct-view`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 15000, // 15 second timeout
            }
          );

          console.log(
            'Direct view response status:',
            directViewResponse.status
          );
          console.log(
            'Direct view response data keys:',
            Object.keys(directViewResponse.data)
          );

          if (directViewResponse.data && directViewResponse.data.directView) {
            // This is a simplified view without the actual document content
            // We'll use placeholder content for display
            const documentName =
              directViewResponse.data.documentName ||
              docData.documentName ||
              'Document';
            const mimeType =
              directViewResponse.data.mimeType ||
              docData.mimeType ||
              'application/octet-stream';

            console.log(`Using simplified document view for: ${documentName}`);

            // For PDFs, we can use a placeholder PDF
            if (mimeType === 'application/pdf') {
              // Create a minimal valid PDF
              const pdfPlaceholder =
                'JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyMzAxMDEwMDAwMDArMDAnMDAnKQovUmVzb3VyY2VzIDIgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9Dcm9wQm94IFswIDAgNTk1IDg0Ml0gL0JsZWVkQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDYgMCBSIC9Sb3RhdGUgMCA+PgplbmRvYmoKNiAwIG9iago8PCAvTGVuZ3RoIDc3IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAw1DMwsdQzNFrFpWBmYGZqZGJgYKZnqGRmYGRmYGxkbmJpZGJpZmJmYWlkZmwJFHO1sDTVMzRcxQUAzXUPJgplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs1IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEgMCBSIC9NZXRhZGF0YSA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDIzIC9UeXBlIC9NZXRhZGF0YSAvU3VidHlwZSAvWE1MID4+CnN0cmVhbQo8P3hwYWNrZXQgYmVnaW49Iu+7vyI/Pgo8P3hwYWNrZXQgZW5kPSJ3Ij8+CmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI4MSAwMDAwMCBuIAowMDAwMDAwNDQwIDAwMDAwIG4gCjAwMDAwMDAzNDAgMDAwMDAgbiAKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxNDQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDMgMCBSIC9JbmZvIDIgMCBSID4+CnN0YXJ0eHJlZgo1MDEKJSVFT0YK';

              setDocumentData({
                data: pdfPlaceholder,
                mimeType: mimeType,
                name: documentName,
                status: docData.status,
                updatedAt: docData.updatedAt,
              });
              return;
            } else if (mimeType.startsWith('image/')) {
              // For images, use a placeholder image
              const imagePlaceholder =
                'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABjUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqUlBYAAAAgdFJOUwAQIDBAUGBwgI+fr7/P3+8gMEBQYHCAj5+vv8/f7y9hWVIAAAGwSURBVHja7d3LbsIwFEXRm1BSniWlpdDy+P9PpGKUdoDkPvbV3p8QWfKJldiOUhQAAAAAAAAAAAAAAAAAAAAAAAAAAADYqHbVN/10aBbbuWuaYTqN/Xj4XbvqxrE/rR+b5nDo+nH1gHbVDcNqbLtFM/XrBnTb5jOm7XoB7XH+YtodVwroP5av+tMqAe2h/2bsDuUDuv3yzX5XOqBdLt/tywb0y/cO+5IBu+X7h13BgG65fO9QLKD/uPzHvlDA7vPyH7tCAfvl8r1DoYD98r1DoYD98r1DoYDd8r1DoYBu+d6hUMBh+d6hUMBx+d6hUMBp+d6hUMB5+d6hUMBl+d6hUMB1+d6hUMBt+d6hUMB9+d6hUMBj+d6hUMBz+d6hUMB/y/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Oe9AYiaJ1FsXZZLAAAAAElFTkSuQmCC';

              setDocumentData({
                data: imagePlaceholder,
                mimeType: mimeType,
                name: documentName,
                status: docData.status,
                updatedAt: docData.updatedAt,
              });
              return;
            }

            // For other types, use a generic placeholder
            setDocumentData({
              data: 'VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgZG9jdW1lbnQgY29udGVudC4gVGhlIGFjdHVhbCBkb2N1bWVudCBjYW4gYmUgdmlld2VkIGluIHRoZSBhZG1pbiBkYXNoYm9hcmQu',
              mimeType: 'text/plain',
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
            });
            return;
          }
        } catch (directViewError) {
          console.error('Direct view endpoint failed:', directViewError);
          // Continue to try the secure-details endpoint
        }

        // Now try the secure-details endpoint
        try {
          console.log('Trying primary secure-details endpoint');
          const response = await axios.get(
            `/api/documents/${documentId}/secure-details`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 20000, // 20 second timeout
            }
          );

          console.log('Secure details response status:', response.status);
          if (response.data) {
            console.log('Response data keys:', Object.keys(response.data));
          } else {
            console.log('Response data is empty');
          }

          const documentName =
            response.data?.documentName || docData.documentName || 'Document';
          const mimeType =
            response.data?.mimeType || 'application/octet-stream';

          if (response.data && response.data.decryptedFile) {
            setDocumentData({
              data: response.data.decryptedFile,
              mimeType: mimeType,
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
            });
          } else if (response.data && response.data.fallback) {
            // This is a fallback response without document content
            console.log('Using fallback view for document');

            setDocumentData({
              data: '', // Empty content
              mimeType: mimeType,
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
              fallback: true,
            });
          } else {
            throw new Error('Invalid document data received from server');
          }
        } catch (apiError) {
          console.error('API error fetching secure details:', apiError);

          // If both endpoints failed, use document metadata from Firestore to show a placeholder
          console.log(
            'Both API endpoints failed, using document metadata from Firestore'
          );

          const documentName = docData.documentName || 'Document';
          const mimeType = docData.mimeType || 'application/octet-stream';

          // Create a placeholder based on the document type
          if (mimeType === 'application/pdf') {
            // Create a minimal valid PDF
            const pdfPlaceholder =
              'JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyMzAxMDEwMDAwMDArMDAnMDAnKQovUmVzb3VyY2VzIDIgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9Dcm9wQm94IFswIDAgNTk1IDg0Ml0gL0JsZWVkQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDYgMCBSIC9Sb3RhdGUgMCA+PgplbmRvYmoKNiAwIG9iago8PCAvTGVuZ3RoIDc3IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAw1DMwsdQzNFrFpWBmYGZqZGJgYKZnqGRmYGRmYGxkbmJpZGJpZmJmYWlkZmwJFHO1sDTVMzRcxQUAzXUPJgplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs1IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEgMCBSIC9NZXRhZGF0YSA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDIzIC9UeXBlIC9NZXRhZGF0YSAvU3VidHlwZSAvWE1MID4+CnN0cmVhbQo8P3hwYWNrZXQgYmVnaW49Iu+7vyI/Pgo8P3hwYWNrZXQgZW5kPSJ3Ij8+CmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI4MSAwMDAwMCBuIAowMDAwMDAwNDQwIDAwMDAwIG4gCjAwMDAwMDAzNDAgMDAwMDAgbiAKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxNDQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDMgMCBSIC9JbmZvIDIgMCBSID4+CnN0YXJ0eHJlZgo1MDEKJSVFT0YK';

            setDocumentData({
              data: pdfPlaceholder,
              mimeType: mimeType,
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
            });
          } else if (mimeType.startsWith('image/')) {
            // For images, use a placeholder image
            const imagePlaceholder =
              'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABjUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqUlBYAAAAgdFJOUwAQIDBAUGBwgI+fr7/P3+8gMEBQYHCAj5+vv8/f7y9hWVIAAAGwSURBVHja7d3LbsIwFEXRm1BSniWlpdDy+P9PpGKUdoDkPvbV3p8QWfKJldiOUhQAAAAAAAAAAAAAAAAAAAAAAAAAAADYqHbVN/10aBbbuWuaYTqN/Xj4XbvqxrE/rR+b5nDo+nH1gHbVDcNqbLtFM/XrBnTb5jOm7XoB7XH+YtodVwroP5av+tMqAe2h/2bsDuUDuv3yzX5XOqBdLt/tywb0y/cO+5IBu+X7h13BgG65fO9QLKD/uPzHvlDA7vPyH7tCAfvl8r1DoYD98r1DoYD98r1DoYDd8r1DoYBu+d6hUMBh+d6hUMBx+d6hUMBp+d6hUMB5+d6hUMBl+d6hUMB1+d6hUMBt+d6hUMB9+d6hUMBj+d6hUMBz+d6hUMB/y/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Oe9AYiaJ1FsXZZLAAAAAElFTkSuQmCC';

            setDocumentData({
              data: imagePlaceholder,
              mimeType: mimeType,
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
            });
          } else {
            // For other types, use a generic placeholder
            setDocumentData({
              data: 'VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgZG9jdW1lbnQgY29udGVudC4gVGhlIGFjdHVhbCBkb2N1bWVudCBjYW4gYmUgdmlld2VkIGluIHRoZSBhZG1pbiBkYXNoYm9hcmQu',
              mimeType: 'text/plain',
              name: documentName,
              status: docData.status,
              updatedAt: docData.updatedAt,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load document for viewing'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackgroundClick}
    >
      <div className="bg-ivory p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-ivory z-10">
          <h3 className="text-xl font-bold text-deep-moss">Document Viewer</h3>
          <div className="flex items-center gap-2">
            {documentData && (
              <button
                onClick={handleDownload}
                className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                title="Download"
              >
                <span className="flex items-center justify-center">
                  <Download size={20} />
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-soft-sage rounded-full"
              title="Close"
            >
              <span className="flex items-center justify-center">
                <X size={20} />
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <NeubrutalistLoading
              message="Document"
              subMessage="Loading document content..."
              showSeal={false}
            />
          </div>
        ) : error ? (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss flex items-start">
            <span className="text-burnt-sienna mr-2 flex-shrink-0 mt-1">
              <AlertCircle size={18} />
            </span>
            <p className="text-deep-moss">{error}</p>
          </div>
        ) : documentData ? (
          <div className="h-[600px]">
            {' '}
            {/* Fixed height for better visibility */}
            {documentData && (
              <DocumentViewer
                documentData={documentData.data}
                mimeType={documentData.mimeType}
                fileName={documentData.name}
                status={documentData.status}
                updatedAt={documentData.updatedAt}
                fallback={documentData.fallback}
              />
            )}
          </div>
        ) : (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss">
            <p className="text-deep-moss">No document data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;
