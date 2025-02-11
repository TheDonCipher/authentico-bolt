'use client';
import React from 'react';
import SidebarNavigation from './components/SidebarNavigation';
import DocumentTable from './components/DocumentTable';

const OrganizationDashboard = () => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input value:', event.target.value);
  };

  // Sample documents; integrate real data as needed
  const documents = [
    {
      id: 1,
      name: 'Passport',
      status: 'verified',
      createdAt: '3/14/22, 10:00 AM',
      updatedAt: '3/14/22, 10:15 AM',
    },
    {
      id: 2,
      name: "Driver's License",
      status: 'pending',
      createdAt: '3/14/22, 10:00 AM',
      updatedAt: '3/14/22, 10:15 AM',
    },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#F5F7F2]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#556B2F] pb-4 text-[#2F4F4F]">
            Organization Dashboard
          </h1>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Total Documents
                </h3>
                <p className="text-4xl font-black text-[#556B2F]">24</p>
              </div>
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Verified
                </h3>
                <p className="text-4xl font-black text-[#698B69]">18</p>
              </div>
              <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2F4F4F]">
                  Pending
                </h3>
                <p className="text-4xl font-black text-[#8B7355]">6</p>
              </div>
            </div>
          </section>

          <section className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
            <h2 className="text-3xl font-black mb-6 text-[#2F4F4F]">
              Recent Documents
            </h2>
            <DocumentTable documents={documents} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default OrganizationDashboard;
