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
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Total Documents Card */}
        <div className="bg-ivory p-6 border-4 border-deep-moss hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-forest-green bg-opacity-5 transform rotate-45 translate-x-8 -translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-forest-green bg-opacity-10 rounded-full mr-3 group-hover:bg-opacity-20 transition-all shadow-sm">
              <FileText className="text-forest-green" size={24} />
            </div>
            <h4 className="font-bold text-xl text-deep-moss">
              Total Documents
            </h4>
          </div>

          <div className="flex items-end justify-between mb-4">
            <p className="text-4xl font-black text-deep-moss drop-shadow-sm">
              {documents.length}
            </p>
            <div className="flex items-center text-forest-green text-sm font-medium bg-forest-green bg-opacity-5 px-2 py-1 rounded-md">
              <BarChart size={16} className="mr-1" />
              All Documents
            </div>
          </div>

          {recentDocuments.length > 0 && (
            <div className="mt-2 text-sm text-deep-moss bg-soft-sage bg-opacity-30 p-3 rounded-md border border-deep-moss border-opacity-10">
              <div className="flex items-center mb-2">
                <List size={14} className="mr-1.5 text-forest-green" />
                <span className="font-medium text-forest-green">
                  Recent Documents
                </span>
              </div>
              <ul className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {recentDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-deep-moss mr-2 flex-shrink-0"></div>
                    <span className="truncate text-xs font-medium">
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
        <div className="bg-ivory p-6 border-4 border-deep-moss hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 transform rotate-45 translate-x-8 -translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-green-100 rounded-full mr-3 group-hover:bg-green-200 transition-all shadow-sm">
              <CheckCircle className="text-green-700" size={24} />
            </div>
            <h4 className="font-bold text-xl text-deep-moss">Verified</h4>
          </div>

          <div className="flex items-end justify-between mb-4">
            <p className="text-4xl font-black text-green-700 drop-shadow-sm">
              {countVerifiedDocuments()}
            </p>
            <div className="flex items-center text-green-700 text-sm font-medium bg-green-50 px-2 py-1 rounded-md">
              <FileText size={16} className="mr-1" />
              Verified Docs
            </div>
          </div>

          {verifiedDocs.length > 0 && (
            <div className="mt-2 text-sm text-deep-moss bg-green-50 p-3 rounded-md border border-green-200">
              <div className="flex items-center mb-2">
                <List size={14} className="mr-1.5 text-green-700" />
                <span className="font-medium text-green-700">
                  Verified Documents
                </span>
              </div>
              <ul className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {verifiedDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-700 mr-2 flex-shrink-0"></div>
                    <span className="truncate text-xs font-medium">
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
        <div className="bg-ivory p-6 border-4 border-deep-moss hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 transform rotate-45 translate-x-8 -translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-amber-100 rounded-full mr-3 group-hover:bg-amber-200 transition-all shadow-sm">
              <Clock className="text-amber-600" size={24} />
            </div>
            <h4 className="font-bold text-xl text-deep-moss">Pending</h4>
          </div>

          <div className="flex items-end justify-between mb-4">
            <p className="text-4xl font-black text-amber-600 drop-shadow-sm">
              {countPendingDocuments()}
            </p>
            <div className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded-md">
              <FileText size={16} className="mr-1" />
              Pending Docs
            </div>
          </div>

          {pendingDocs.length > 0 && (
            <div className="mt-2 text-sm text-deep-moss bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-center mb-2">
                <List size={14} className="mr-1.5 text-amber-600" />
                <span className="font-medium text-amber-600">
                  Pending Documents
                </span>
              </div>
              <ul className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {pendingDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2 flex-shrink-0"></div>
                    <span className="truncate text-xs font-medium">
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
        <div className="bg-ivory p-6 border-4 border-deep-moss hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,0.8)] transition-all hover:-translate-y-1 group relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 transform rotate-45 translate-x-8 -translate-y-8 border-b border-deep-moss border-opacity-20"></div>

          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-red-100 rounded-full mr-3 group-hover:bg-red-200 transition-all shadow-sm">
              <XCircle className="text-red-700" size={24} />
            </div>
            <h4 className="font-bold text-xl text-deep-moss">Rejected</h4>
          </div>

          <div className="flex items-end justify-between mb-4">
            <p className="text-4xl font-black text-red-700 drop-shadow-sm">
              {countRejectedDocuments()}
            </p>
            <div className="flex items-center text-red-700 text-sm font-medium bg-red-50 px-2 py-1 rounded-md">
              <FileText size={16} className="mr-1" />
              Rejected Docs
            </div>
          </div>

          {rejectedDocs.length > 0 && (
            <div className="mt-2 text-sm text-deep-moss bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-center mb-2">
                <List size={14} className="mr-1.5 text-red-700" />
                <span className="font-medium text-red-700">
                  Rejected Documents
                </span>
              </div>
              <ul className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {rejectedDocs.map((doc, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-700 mr-2 flex-shrink-0"></div>
                    <span className="truncate text-xs font-medium">
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
