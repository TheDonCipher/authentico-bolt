'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';

const APIKeys = () => {
  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            API Keys
          </h1>

          <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-[#2C3639]">
                Your API Keys
              </h2>
              <button className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                Generate New Key
              </button>
            </div>

            <div className="space-y-4">
              {/* Key 1 */}
              <div className="bg-[#F5F5F0] border-2 border-[#4A5043] p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-[#2C3639]">
                      Production API Key
                    </h3>
                    <p className="text-sm text-[#4A5043]">
                      Created on March 15, 2024
                    </p>
                  </div>
                  <button className="text-[#A14343] hover:text-[#8A3232]">
                    Revoke
                  </button>
                </div>
                <div className="bg-[#E6E5DD] p-3 font-mono text-[#4A5043] border border-[#4A5043]">
                  sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </div>
              </div>

              {/* Key 2 */}
              <div className="bg-[#F5F5F0] border-2 border-[#4A5043] p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-[#2C3639]">Test API Key</h3>
                    <p className="text-sm text-[#4A5043]">
                      Created on March 14, 2024
                    </p>
                  </div>
                  <button className="text-[#A14343] hover:text-[#8A3232]">
                    Revoke
                  </button>
                </div>
                <div className="bg-[#E6E5DD] p-3 font-mono text-[#4A5043] border border-[#4A5043]">
                  sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default APIKeys;
