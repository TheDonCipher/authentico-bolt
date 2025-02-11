'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';

const Support = () => {
  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Support
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <section className="bg-[#E6E5DD] p-6 border-4 border-[#4A5043] shadow-brutal">
              <h2 className="text-2xl font-black mb-4 text-[#2C3639]">
                Contact Support
              </h2>
              <p className="mb-4 text-[#4A5043]">
                Need help? Our team is available 24/7.
              </p>
              <button className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                Open Support Ticket
              </button>
            </section>

            <section className="bg-[#E6E5DD] p-6 border-4 border-[#4A5043] shadow-brutal">
              <h2 className="text-2xl font-black mb-4 text-[#2C3639]">
                Documentation
              </h2>
              <p className="mb-4 text-[#4A5043]">
                Explore our guides and API documentation.
              </p>
              <button className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                View Docs
              </button>
            </section>
          </div>

          <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
            <h2 className="text-2xl font-black mb-6 text-[#2C3639]">FAQ</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 border-2 border-[#4A5043] bg-[#F5F5F0]"
                >
                  <h3 className="font-bold mb-2 text-[#2C3639]">
                    Common Question {i}?
                  </h3>
                  <p className="text-[#4A5043]">
                    Here&apos;s a detailed answer to the question...
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Support;
