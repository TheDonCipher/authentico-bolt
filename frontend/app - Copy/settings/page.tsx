'use client';
import React from 'react';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';

const Settings = () => {
  return (
    <div className="relative flex min-h-screen bg-[#F5F5F0]">
      <SidebarNavigation />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-8 border-b-4 border-[#4A5043] pb-4 text-[#2C3639]">
            Settings
          </h1>

          <div className="grid grid-cols-1 gap-8">
            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Organization Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-[#2C3639]">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    className="w-full p-3 border-2 border-[#4A5043] bg-[#F5F5F0]"
                  />
                </div>
                <button className="bg-[#4A5043] text-white px-6 py-3 font-bold hover:bg-[#5A6053]">
                  Save Changes
                </button>
              </div>
            </section>

            <section className="bg-[#E6E5DD] border-4 border-[#4A5043] p-6 shadow-brutal">
              <h2 className="text-2xl font-black mb-6 text-[#2C3639]">
                Security Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border-2 border-[#4A5043] bg-[#F5F5F0]">
                  <div>
                    <p className="font-bold text-[#2C3639]">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-[#4A5043]">
                      Add an extra layer of security
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-[#4A6741]/20 text-[#4A6741] border-2 border-[#4A6741]">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border-2 border-[#4A5043] bg-[#F5F5F0]">
                  <div>
                    <p className="font-bold text-[#2C3639]">Session Timeout</p>
                    <p className="text-sm text-[#4A5043]">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <select className="p-2 border-2 border-[#4A5043] bg-[#F5F5F0]">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
