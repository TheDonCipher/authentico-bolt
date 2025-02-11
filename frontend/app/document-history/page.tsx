'use client';
import React, { useState } from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';
import DocumentsList from '../document-history/components/DocumentsList';

const DocumentDetails = () => {
  const mockDocuments = [
    {
      id: '1',
      name: 'Passport - John Smith',
      type: 'Identity Document',
      status: 'verified' as const,
      sender: 'John Smith',
      receivedDate: 'Mar 15, 2024',
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      name: 'Birth Certificate - Sarah Johnson',
      type: 'Legal Document',
      status: 'pending' as const,
      sender: 'Sarah Johnson',
      receivedDate: 'Mar 14, 2024',
      fileSize: '1.8 MB',
    },
    {
      id: '3',
      name: 'Driver License - Mike Brown',
      type: 'Identity Document',
      status: 'rejected' as const,
      sender: 'Mike Brown',
      receivedDate: 'Mar 13, 2024',
      fileSize: '1.2 MB',
    },
    {
      id: '4',
      name: 'Business Registration',
      type: 'Legal Document',
      status: 'verified' as const,
      sender: 'Alice Corp',
      receivedDate: 'Mar 12, 2024',
      fileSize: '3.1 MB',
    },
    {
      id: '5',
      name: 'Medical Certificate - Emma Wilson',
      type: 'Medical Document',
      status: 'verified' as const,
      sender: 'Emma Wilson',
      receivedDate: 'Mar 11, 2024',
      fileSize: '1.5 MB',
    },
    {
      id: '6',
      name: 'Property Deed - Robert Taylor',
      type: 'Legal Document',
      status: 'pending' as const,
      sender: 'Robert Taylor',
      receivedDate: 'Mar 10, 2024',
      fileSize: '4.2 MB',
    },
    {
      id: '7',
      name: 'Marriage Certificate - Lisa & James',
      type: 'Legal Document',
      status: 'verified' as const,
      sender: 'Lisa Chen',
      receivedDate: 'Mar 9, 2024',
      fileSize: '2.8 MB',
    },
    {
      id: '8',
      name: 'Student ID - Tom Wilson',
      type: 'Identity Document',
      status: 'pending' as const,
      sender: 'Tom Wilson',
      receivedDate: 'Mar 8, 2024',
      fileSize: '0.8 MB',
    },
    {
      id: '9',
      name: 'Work Permit - Maria Garcia',
      type: 'Government Document',
      status: 'rejected' as const,
      sender: 'Maria Garcia',
      receivedDate: 'Mar 7, 2024',
      fileSize: '1.9 MB',
    },
    {
      id: '10',
      name: 'Insurance Policy',
      type: 'Financial Document',
      status: 'verified' as const,
      sender: 'XYZ Insurance',
      receivedDate: 'Mar 6, 2024',
      fileSize: '2.1 MB',
    },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Document History
          </h1>

          <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-[#2C3639]">
                All Documents
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="px-4 py-2 border-2 border-[#4A5043] bg-[#F5F5F0]"
                />
                <select className="px-4 py-2 border-2 border-[#4A5043] bg-[#F5F5F0] text-[#2C3639]">
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <DocumentsList documents={mockDocuments} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default DocumentDetails;
