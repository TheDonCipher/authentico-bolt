import type { Document } from '../../types/dashboard';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  BarChart,
  List,
} from 'lucide-react';
import { getDocumentTypeName } from '../../constants/documentTypes';
import './stats.css';

interface StatsProps {
  documents: Document[];
}

export const Stats = ({ documents }: StatsProps) => {
  // Count documents by status, handling different status formats
  const countVerifiedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'verified';
    }).length;
  };

  const countPendingDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'pending' || status === 'pending verification';
    }).length;
  };

  const countRejectedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'rejected';
    }).length;
  };

  // Get documents by status and sort by date (most recent first)
  const sortByDate = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      const dateA = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const dateB = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
      return dateB - dateA; // Most recent first
    });
  };

  const getVerifiedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'verified';
    });
  };

  const getPendingDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'pending' || status === 'pending verification';
    });
  };

  const getRejectedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'rejected';
    });
  };

  // Get the document lists sorted by date (most recent first)
  const recentDocuments = sortByDate(documents).slice(0, 5); // Show only 5 most recent documents
  const verifiedDocs = sortByDate(getVerifiedDocuments()).slice(0, 5);
  const pendingDocs = sortByDate(getPendingDocuments()).slice(0, 5);
  const rejectedDocs = sortByDate(getRejectedDocuments()).slice(0, 5);

  return (
    <div className="mb-4 xs:mb-6 sm:mb-8">
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
        {/* Total Documents Card */}
        <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 xs:border-3 sm:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] sm:hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-12 xs:w-14 sm:w-16 h-12 xs:h-14 sm:h-16 bg-forest-green bg-opacity-5 transform rotate-45 translate-x-6 xs:translate-x-7 sm:translate-x-8 -translate-y-6 xs:-translate-y-7 sm:-translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-2.5 bg-forest-green bg-opacity-10 rounded-full mr-2 xs:mr-3 group-hover:bg-opacity-20 transition-all shadow-sm">
              <FileText className="text-forest-green w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm xs:text-base sm:text-xl text-deep-moss">
              Total Documents
            </h4>
          </div>

          <div className="flex items-end justify-between mb-2 xs:mb-3 sm:mb-4">
            <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-deep-moss drop-shadow-sm">
              {documents.length}
            </p>
            <div className="flex items-center text-forest-green text-xs xs:text-sm font-medium bg-forest-green bg-opacity-5 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md">
              <BarChart size={12} className="xs:w-4 xs:h-4 mr-1" />
              <span className="hidden xs:inline">All Documents</span>
              <span className="xs:hidden">All Docs</span>
            </div>
          </div>

          {recentDocuments.length > 0 && (
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-deep-moss bg-soft-sage bg-opacity-30 p-2 xs:p-3 rounded-md border border-deep-moss border-opacity-10">
              <div className="flex items-center mb-1 xs:mb-2">
                <List
                  size={12}
                  className="xs:w-3.5 xs:h-3.5 mr-1 xs:mr-1.5 text-forest-green"
                />
                <span className="font-medium text-forest-green text-xs xs:text-sm">
                  Recent Documents
                </span>
              </div>
              <ul className="space-y-1 xs:space-y-2 max-h-16 xs:max-h-20 sm:max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {recentDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-deep-moss mr-1 xs:mr-2 flex-shrink-0"></div>
                    <span className="truncate text-[10px] xs:text-xs font-medium">
                      {doc.documentName ||
                        getDocumentTypeName(doc.documentType) ||
                        `Document ${index + 1}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Verified Documents Card */}
        <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 xs:border-3 sm:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] sm:hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-12 xs:w-14 sm:w-16 h-12 xs:h-14 sm:h-16 bg-green-100 transform rotate-45 translate-x-6 xs:translate-x-7 sm:translate-x-8 -translate-y-6 xs:-translate-y-7 sm:-translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-2.5 bg-green-100 rounded-full mr-2 xs:mr-3 group-hover:bg-green-200 transition-all shadow-sm">
              <CheckCircle className="text-green-700 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm xs:text-base sm:text-xl text-deep-moss">
              Verified
            </h4>
          </div>

          <div className="flex items-end justify-between mb-2 xs:mb-3 sm:mb-4">
            <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-green-700 drop-shadow-sm">
              {countVerifiedDocuments()}
            </p>
            <div className="flex items-center text-green-700 text-xs xs:text-sm font-medium bg-green-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md">
              <FileText size={12} className="xs:w-4 xs:h-4 mr-1" />
              <span className="hidden xs:inline">Verified Docs</span>
              <span className="xs:hidden">Verified</span>
            </div>
          </div>

          {verifiedDocs.length > 0 && (
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-deep-moss bg-green-50 p-2 xs:p-3 rounded-md border border-green-200">
              <div className="flex items-center mb-1 xs:mb-2">
                <List
                  size={12}
                  className="xs:w-3.5 xs:h-3.5 mr-1 xs:mr-1.5 text-green-700"
                />
                <span className="font-medium text-green-700 text-xs xs:text-sm">
                  Verified Documents
                </span>
              </div>
              <ul className="space-y-1 xs:space-y-2 max-h-16 xs:max-h-20 sm:max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {verifiedDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-green-700 mr-1 xs:mr-2 flex-shrink-0"></div>
                    <span className="truncate text-[10px] xs:text-xs font-medium">
                      {doc.documentName ||
                        getDocumentTypeName(doc.documentType) ||
                        `Document ${index + 1}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Pending Documents Card */}
        <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 xs:border-3 sm:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] sm:hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-12 xs:w-14 sm:w-16 h-12 xs:h-14 sm:h-16 bg-amber-50 transform rotate-45 translate-x-6 xs:translate-x-7 sm:translate-x-8 -translate-y-6 xs:-translate-y-7 sm:-translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-2.5 bg-amber-100 rounded-full mr-2 xs:mr-3 group-hover:bg-amber-200 transition-all shadow-sm">
              <Clock className="text-amber-600 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm xs:text-base sm:text-xl text-deep-moss">
              Pending
            </h4>
          </div>

          <div className="flex items-end justify-between mb-2 xs:mb-3 sm:mb-4">
            <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-amber-600 drop-shadow-sm">
              {countPendingDocuments()}
            </p>
            <div className="flex items-center text-amber-600 text-xs xs:text-sm font-medium bg-amber-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md">
              <FileText size={12} className="xs:w-4 xs:h-4 mr-1" />
              <span className="hidden xs:inline">Pending Docs</span>
              <span className="xs:hidden">Pending</span>
            </div>
          </div>

          {pendingDocs.length > 0 && (
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-deep-moss bg-amber-50 p-2 xs:p-3 rounded-md border border-amber-200">
              <div className="flex items-center mb-1 xs:mb-2">
                <List
                  size={12}
                  className="xs:w-3.5 xs:h-3.5 mr-1 xs:mr-1.5 text-amber-600"
                />
                <span className="font-medium text-amber-600 text-xs xs:text-sm">
                  Pending Documents
                </span>
              </div>
              <ul className="space-y-1 xs:space-y-2 max-h-16 xs:max-h-20 sm:max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {pendingDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-amber-600 mr-1 xs:mr-2 flex-shrink-0"></div>
                    <span className="truncate text-[10px] xs:text-xs font-medium">
                      {doc.documentName ||
                        getDocumentTypeName(doc.documentType) ||
                        `Document ${index + 1}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rejected Documents Card */}
        <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 xs:border-3 sm:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] sm:hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-12 xs:w-14 sm:w-16 h-12 xs:h-14 sm:h-16 bg-red-50 transform rotate-45 translate-x-6 xs:translate-x-7 sm:translate-x-8 -translate-y-6 xs:-translate-y-7 sm:-translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-2.5 bg-red-100 rounded-full mr-2 xs:mr-3 group-hover:bg-red-200 transition-all shadow-sm">
              <XCircle className="text-red-700 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm xs:text-base sm:text-xl text-deep-moss">
              Rejected
            </h4>
          </div>

          <div className="flex items-end justify-between mb-2 xs:mb-3 sm:mb-4">
            <p className="text-2xl xs:text-3xl sm:text-4xl font-black text-red-700 drop-shadow-sm">
              {countRejectedDocuments()}
            </p>
            <div className="flex items-center text-red-700 text-xs xs:text-sm font-medium bg-red-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md">
              <FileText size={12} className="xs:w-4 xs:h-4 mr-1" />
              <span className="hidden xs:inline">Rejected Docs</span>
              <span className="xs:hidden">Rejected</span>
            </div>
          </div>

          {rejectedDocs.length > 0 && (
            <div className="mt-1 xs:mt-2 text-xs xs:text-sm text-deep-moss bg-red-50 p-2 xs:p-3 rounded-md border border-red-200">
              <div className="flex items-center mb-1 xs:mb-2">
                <List
                  size={12}
                  className="xs:w-3.5 xs:h-3.5 mr-1 xs:mr-1.5 text-red-700"
                />
                <span className="font-medium text-red-700 text-xs xs:text-sm">
                  Rejected Documents
                </span>
              </div>
              <ul className="space-y-1 xs:space-y-2 max-h-16 xs:max-h-20 sm:max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {rejectedDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-red-700 mr-1 xs:mr-2 flex-shrink-0"></div>
                    <span className="truncate text-[10px] xs:text-xs font-medium">
                      {doc.documentName ||
                        getDocumentTypeName(doc.documentType) ||
                        `Document ${index + 1}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
