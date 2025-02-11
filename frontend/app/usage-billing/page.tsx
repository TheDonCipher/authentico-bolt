'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';

const UsageBilling = () => {
  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Usage & Billing
          </h1>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#E6E5DD] p-6 border-4 border-[#4A5043] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2C3639]">
                  Current Plan
                </h3>
                <p className="text-4xl font-black text-[#4A6741]">Pro</p>
              </div>
              <div className="bg-[#E6E5DD] p-6 border-4 border-[#4A5043] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2C3639]">
                  Monthly Usage
                </h3>
                <p className="text-4xl font-black text-[#4A5043]">2,451</p>
              </div>
              <div className="bg-[#E6E5DD] p-6 border-4 border-[#4A5043] shadow-brutal">
                <h3 className="font-bold text-xl mb-2 text-[#2C3639]">
                  Next Billing
                </h3>
                <p className="text-4xl font-black text-[#8B7355]">P49</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Usage History
              </h2>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between p-4 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  >
                    <span className="font-bold text-[#2C3639]">
                      March {i}, 2024
                    </span>
                    <span className="text-[#4A5043]">{850 * i} API calls</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Payment Method
              </h2>
              <div className="p-4 border-2 border-[#4A5043] bg-[#F5F5F0] mb-4">
                <p className="font-bold text-[#2C3639]">Current Method</p>
                <p className="text-[#4A5043]">•••• •••• •••• 4242</p>
              </div>
              <button className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                Update Payment Method
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UsageBilling;
