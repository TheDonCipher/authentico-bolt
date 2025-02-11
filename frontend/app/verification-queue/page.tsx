'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';
import VerificationTable from './components/VerificationTable';

const VerificationQueue = () => {
  const mockVerifications = [
    {
      id: 1,
      documentName: "Driver's License - John Smith",
      submittedBy: 'John Smith',
      submittedAt: '2024-01-15 09:30 AM',
      documentType: 'Identity Document',
    },
    {
      id: 2,
      documentName: 'Passport - Sarah Johnson',
      submittedBy: 'Sarah Johnson',
      submittedAt: '2024-01-15 10:15 AM',
      documentType: 'Travel Document',
    },
    {
      id: 3,
      documentName: 'Birth Certificate - Michael Brown',
      submittedBy: 'Michael Brown',
      submittedAt: '2024-01-15 11:45 AM',
      documentType: 'Legal Document',
    },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Verification Queue
          </h1>

          <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-[#2C3639]">
                Pending Verifications
              </h2>
            </div>
            <VerificationTable verifications={mockVerifications} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default VerificationQueue;
