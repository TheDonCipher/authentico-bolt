'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { ProfileCard } from '../../components/dashboard/ProfileCard';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { Loader } from '../../components/ui/Loader';
import { Toast } from '../../components/ui/Toast';
import { 
  Home, 
  Users, 
  Building, 
  FileText, 
  Settings, 
  Shield,
  Menu,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getDocumentTypeName } from '../../constants/documentTypes';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Document {
  id: string;
  documentId: string;
  documentType: string;
  documentName?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  publicAddress: string;
  verifyingOrgId?: string;
  verifyingOrgName?: string;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDocuments();
    }
  }, [user, isAdmin]);

  // Filter documents when status filter or search term changes
  useEffect(() => {
    if (!documents.length) {
      setFilteredDocuments([]);
      return;
    }

    let filtered = [...documents];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          (doc.documentName && doc.documentName.toLowerCase().includes(search)) ||
          doc.documentType.toLowerCase().includes(search) ||
          (doc.verifyingOrgName && doc.verifyingOrgName.toLowerCase().includes(search))
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, statusFilter, searchTerm]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const documentsQuery = query(
        collection(db, 'documents'),
        orderBy('createdAt', 'desc')
      );

      const documentsSnapshot = await getDocs(documentsQuery);
      const documentsData = documentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          documentId: data.documentId,
          documentType: data.documentType,
          documentName: data.documentName,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate() || null,
          publicAddress: data.publicAddress,
          verifyingOrgId: data.verifyingOrgId,
          verifyingOrgName: data.verifyingOrgName,
          verifiedAt: data.verifiedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate(),
          rejectionReason: data.rejectionReason,
        };
      });

      setDocuments(documentsData);
      setFilteredDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load documents',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            <CheckCircle className="inline-block mr-1" size={12} />
            Verified
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
            <XCircle className="inline-block mr-1" size={12} />
            Rejected
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock className="inline-block mr-1" size={12} />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            {status}
          </span>
        );
    }
  };

  if (!user) {
    return <Loader />;
  }

  return (
    <AuthGuard allowedUserTypes={['admin']}>
      <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed top-4 right-4 z-50 bg-soft-sage p-2 border-2 border-deep-moss"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:static top-0 left-0 h-screen w-64 bg-soft-sage border-r-4 border-deep-moss p-6 transition-transform duration-300 ease-in-out md:translate-x-0 z-40`}
        >
          <div className="h-full flex flex-col">
            <h1 className="text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
              AUTHENTICO
            </h1>
            
            <nav className="space-y-2 flex-1">
              <Link href="/admin-dashboard">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Home size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Dashboard</span>
                </div>
              </Link>
              
              <Link href="/admin-dashboard/users">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Users size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Users</span>
                </div>
              </Link>
              
              <Link href="/admin-dashboard/organizations">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Building size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Organizations</span>
                </div>
              </Link>
              
              <Link href="/admin-dashboard/documents">
                <div className="flex items-center gap-3 px-4 py-3 bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal">
                  <FileText size={20} className="text-ivory" />
                  <span className="font-bold">Documents</span>
                </div>
              </Link>
              
              <Link href="/admin-dashboard/settings">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Settings size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Settings</span>
                </div>
              </Link>
            </nav>
            
            <div className="mt-auto pt-6">
              <Link href="/">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-deep-moss bg-ivory hover:bg-soft-sage hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <span className="font-bold text-deep-moss">Back to Home</span>
                </div>
              </Link>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-black text-deep-moss mr-4">
                  Documents Management
                </h1>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-300 text-sm font-medium">
                  <Shield size={16} className="inline-block mr-1" />
                  Admin
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell count={0} onClick={() => {}} />
                <ProfileCard />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                  Document Management
                </h3>
                <p className="text-deep-moss mb-4">
                  View and manage all documents in the system.
                </p>
                
                {/* Filter controls */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, type, or organization..."
                        className="w-full p-3 pl-10 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                      />
                      <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    >
                      <option value="all">All Documents</option>
                      <option value="Pending Verification">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                
                {/* Status counts */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div
                    className={`p-3 border-2 ${
                      statusFilter === 'all'
                        ? 'bg-soft-sage border-deep-moss'
                        : 'bg-white border-gray-200'
                    } cursor-pointer hover:shadow-brutal transition-all`}
                    onClick={() => setStatusFilter('all')}
                  >
                    <div className="text-sm font-medium text-gray-600">All</div>
                    <div className="text-2xl font-bold text-deep-moss">
                      {documents.length}
                    </div>
                  </div>
                  <div
                    className={`p-3 border-2 ${
                      statusFilter === 'Pending Verification'
                        ? 'bg-soft-sage border-deep-moss'
                        : 'bg-white border-gray-200'
                    } cursor-pointer hover:shadow-brutal transition-all`}
                    onClick={() => setStatusFilter('Pending Verification')}
                  >
                    <div className="text-sm font-medium text-yellow-600">Pending</div>
                    <div className="text-2xl font-bold text-deep-moss">
                      {documents.filter((doc) => doc.status === 'Pending Verification').length}
                    </div>
                  </div>
                  <div
                    className={`p-3 border-2 ${
                      statusFilter === 'Verified'
                        ? 'bg-soft-sage border-deep-moss'
                        : 'bg-white border-gray-200'
                    } cursor-pointer hover:shadow-brutal transition-all`}
                    onClick={() => setStatusFilter('Verified')}
                  >
                    <div className="text-sm font-medium text-green-600">Verified</div>
                    <div className="text-2xl font-bold text-deep-moss">
                      {documents.filter((doc) => doc.status === 'Verified').length}
                    </div>
                  </div>
                  <div
                    className={`p-3 border-2 ${
                      statusFilter === 'Rejected'
                        ? 'bg-soft-sage border-deep-moss'
                        : 'bg-white border-gray-200'
                    } cursor-pointer hover:shadow-brutal transition-all`}
                    onClick={() => setStatusFilter('Rejected')}
                  >
                    <div className="text-sm font-medium text-red-600">Rejected</div>
                    <div className="text-2xl font-bold text-deep-moss">
                      {documents.filter((doc) => doc.status === 'Rejected').length}
                    </div>
                  </div>
                </div>
                
                {loading ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <Loader text="Loading documents..." />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <Clock size={48} className="mx-auto mb-4 text-deep-moss" />
                    <p className="text-lg font-bold text-deep-moss">
                      No documents found
                    </p>
                    <p className="text-deep-moss">
                      When users upload documents, they will appear here.
                    </p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <Search size={48} className="mx-auto mb-4 text-deep-moss" />
                    <p className="text-lg font-bold text-deep-moss">
                      No matching documents
                    </p>
                    <p className="text-deep-moss">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white border-2 border-deep-moss">
                      <thead>
                        <tr className="bg-soft-sage">
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Document Name
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Type
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Verifying Organization
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Status
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Created
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr
                            key={doc.id}
                            className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30 cursor-pointer"
                            onClick={() => setViewingDoc(doc)}
                          >
                            <td className="p-3 text-deep-moss font-medium">
                              {doc.documentName || getDocumentTypeName(doc.documentType)}
                            </td>
                            <td className="p-3 text-deep-moss">
                              {getDocumentTypeName(doc.documentType)}
                            </td>
                            <td className="p-3 text-deep-moss">
                              {doc.verifyingOrgName || 'Not specified'}
                            </td>
                            <td className="p-3">{getStatusBadge(doc.status)}</td>
                            <td className="p-3 text-deep-moss">
                              {formatDate(doc.createdAt)}
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex space-x-2">
                                <Link 
                                  href={`/verify/${doc.documentId}`}
                                  target="_blank"
                                  className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                                  title="View Document"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Document Details Dialog */}
                {viewingDoc && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-deep-moss">
                          {viewingDoc.documentName || getDocumentTypeName(viewingDoc.documentType)}
                          <span className="ml-3">
                            {getStatusBadge(viewingDoc.status)}
                          </span>
                        </h3>
                        <button
                          onClick={() => setViewingDoc(null)}
                          className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 border-2 border-deep-moss">
                          <h4 className="font-bold mb-3 text-deep-moss">
                            Document Information
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-bold text-gray-500">Document ID</p>
                              <p className="font-mono">{viewingDoc.documentId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">Document Type</p>
                              <p>{getDocumentTypeName(viewingDoc.documentType)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">Status</p>
                              <p>{viewingDoc.status}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">Created At</p>
                              <p>{formatDate(viewingDoc.createdAt)}</p>
                            </div>
                            {viewingDoc.updatedAt && (
                              <div>
                                <p className="text-sm font-bold text-gray-500">Updated At</p>
                                <p>{formatDate(viewingDoc.updatedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 border-2 border-deep-moss">
                          <h4 className="font-bold mb-3 text-deep-moss">
                            Verification Information
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-bold text-gray-500">Owner Address</p>
                              <p className="font-mono">{viewingDoc.publicAddress}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">Verifying Organization</p>
                              <p>{viewingDoc.verifyingOrgName || 'Not specified'}</p>
                            </div>
                            {viewingDoc.verifiedAt && (
                              <div>
                                <p className="text-sm font-bold text-gray-500">Verified At</p>
                                <p>{formatDate(viewingDoc.verifiedAt)}</p>
                              </div>
                            )}
                            {viewingDoc.rejectedAt && (
                              <div>
                                <p className="text-sm font-bold text-gray-500">Rejected At</p>
                                <p>{formatDate(viewingDoc.rejectedAt)}</p>
                              </div>
                            )}
                            {viewingDoc.rejectionReason && (
                              <div>
                                <p className="text-sm font-bold text-gray-500">Rejection Reason</p>
                                <p>{viewingDoc.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-6">
                        <Link 
                          href={`/verify/${viewingDoc.documentId}`}
                          target="_blank"
                          className="bg-forest-green text-white px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          View Verification Page
                        </Link>
                        <button
                          onClick={() => setViewingDoc(null)}
                          className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
      
      {/* Toast notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </AuthGuard>
  );
}
