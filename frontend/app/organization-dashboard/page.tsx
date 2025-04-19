'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Eye, Download, FileText, Grid, List, Plus } from 'lucide-react';
import { Toast } from '../components/ui/Toast';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const OrganizationDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const router = useRouter();

  // Handle connect wallet button click
  const handleConnectWallet = () => {
    router.push('/');
    setToastMessage({
      type: 'warning',
      message: 'Please connect your wallet to access your organization dashboard',
    });
  };

  return (
    <div className="relative flex flex-col md:flex-row min-h-screen bg-ivory">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
        <Link href="/" className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
          AUTHENTICO
        </Link>
        
        {/* Demo organization info */}
        <div className="hidden md:flex items-center gap-2 mb-6 p-4 bg-soft-sage border-2 border-deep-moss">
          <div className="bg-forest-green text-ivory p-2 rounded-full">
            <span className="font-bold">Demo</span>
          </div>
          <div>
            <p className="font-bold">Demo Organization</p>
            <p className="text-sm">This is a demo dashboard</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex justify-around md:block">
          <ul className="flex md:flex-col w-full gap-2 md:gap-4">
            <li className="w-full">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'dashboard'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Dashboard</span>
                <span className="md:hidden">Dashboard</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('verification')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'verification'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Verification Queue</span>
                <span className="md:hidden">Verify</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'settings'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Settings</span>
                <span className="md:hidden">Settings</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
            <div className="flex items-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss mr-4">
                Organization Dashboard Demo
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleConnectWallet}
                className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
              >
                Connect Wallet
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
            <h3 className="text-lg font-bold mb-2">Demo Dashboard</h3>
            <p className="mb-3">
              This is a demo of the Organization Dashboard. Connect your wallet to access your organization dashboard.
            </p>
            <button
              onClick={handleConnectWallet}
              className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              Connect Wallet
            </button>
          </div>

          {/* Organization Verification Status */}
          <section className="mb-8 md:mb-12">
            <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-deep-moss">Demo Organization</h3>
                    <div className="bg-forest-green text-ivory px-3 py-1 rounded-full border border-deep-moss text-sm font-medium">
                      Verified
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Organization Name
                      </p>
                      <p className="text-deep-moss">Demo Organization</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Contact Email
                      </p>
                      <p className="text-deep-moss">contact@demo-org.com</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-forest-green text-ivory p-4 border-2 border-deep-moss">
                  <div className="mr-3">
                    <Check size={32} />
                  </div>
                  <div>
                    <span className="font-black text-lg">VERIFIED</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-deep-moss">
                  Your organization has been verified and can now verify documents on the Authentico platform. When users select your organization during document upload, you'll receive a verification request.
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-8 md:mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                  Total Documents
                </h3>
                <p className="text-3xl md:text-4xl font-black text-deep-moss">
                  12
                </p>
              </div>
              <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                  Verified
                </h3>
                <p className="text-3xl md:text-4xl font-black text-sap-green">
                  8
                </p>
              </div>
              <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal sm:col-span-2 md:col-span-1">
                <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                  Pending
                </h3>
                <p className="text-3xl md:text-4xl font-black text-sunflower">
                  4
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap mb-6 border-b-4 border-deep-moss pb-4 gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`mr-2 md:mr-4 px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                activeTab === 'dashboard'
                  ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                  : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                activeTab === 'verification'
                  ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                  : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
              }`}
            >
              Verification Queue
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal overflow-x-auto">
              <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-deep-moss">
                Recent Documents
              </h2>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-deep-moss text-ivory">
                      <th className="p-2 text-left">Document Name</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Submitted By</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-deep-moss">
                      <td className="p-2">Passport</td>
                      <td className="p-2">Identity Document</td>
                      <td className="p-2">John Doe</td>
                      <td className="p-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold border border-green-800 rounded">
                          Verified
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Eye size={18} />
                          </button>
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-deep-moss">
                      <td className="p-2">Degree Certificate</td>
                      <td className="p-2">Education Document</td>
                      <td className="p-2">Jane Smith</td>
                      <td className="p-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-bold border border-yellow-800 rounded">
                          Pending
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Eye size={18} />
                          </button>
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Check size={18} />
                          </button>
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-deep-moss">
                      <td className="p-2">Employment Contract</td>
                      <td className="p-2">Employment Document</td>
                      <td className="p-2">Robert Johnson</td>
                      <td className="p-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold border border-green-800 rounded">
                          Verified
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Eye size={18} />
                          </button>
                          <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : activeTab === 'verification' ? (
            <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
              <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-deep-moss">
                Verification Queue
              </h2>
              <div className="space-y-4">
                <div className="bg-ivory p-4 border-2 border-deep-moss">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-deep-moss">Degree Certificate</h3>
                      <p className="text-sm text-gray-600">Education Document</p>
                      <p className="text-sm text-gray-600">Submitted by: Jane Smith</p>
                      <p className="text-sm text-gray-600">Date: 02/20/2023</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-forest-green text-ivory px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                        <Check size={18} className="mr-1" />
                        Verify
                      </button>
                      <button className="bg-red-500 text-ivory px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                        <X size={18} className="mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button className="text-deep-moss hover:underline flex items-center">
                      <Eye size={18} className="mr-1" />
                      View Document
                    </button>
                  </div>
                </div>
                
                <div className="bg-ivory p-4 border-2 border-deep-moss">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-deep-moss">Medical Certificate</h3>
                      <p className="text-sm text-gray-600">Health Document</p>
                      <p className="text-sm text-gray-600">Submitted by: Michael Brown</p>
                      <p className="text-sm text-gray-600">Date: 03/15/2023</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-forest-green text-ivory px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                        <Check size={18} className="mr-1" />
                        Verify
                      </button>
                      <button className="bg-red-500 text-ivory px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                        <X size={18} className="mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button className="text-deep-moss hover:underline flex items-center">
                      <Eye size={18} className="mr-1" />
                      View Document
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
              <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-deep-moss">
                Organization Settings
              </h2>
              <div className="bg-ivory p-6 border-2 border-deep-moss">
                <p className="text-deep-moss mb-4">
                  Connect your wallet to access your organization settings.
                </p>
                <button
                  onClick={handleConnectWallet}
                  className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Connect Wallet
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        </div>
      )}
    </div>
  );
};

export default OrganizationDashboardDemo;
