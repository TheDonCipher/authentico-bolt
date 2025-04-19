'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, X, Bell, Grid, List, FileText, Share2, QrCode, Eye } from 'lucide-react';
import { Toast } from '../components/ui/Toast';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const IndividualDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const router = useRouter();

  // Handle connect wallet button click
  const handleConnectWallet = () => {
    router.push('/');
    setToastMessage({
      type: 'warning',
      message: 'Please connect your wallet to access your personal dashboard',
    });
  };

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
      {/* Sidebar - now becomes a bottom nav on mobile */}
      <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
        <Link href="/" className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
          AUTHENTICO
        </Link>
        {/* Demo user info */}
        <div className="hidden md:flex items-center gap-2 mb-6 p-4 bg-soft-sage border-2 border-deep-moss">
          <div className="bg-forest-green text-ivory p-2 rounded-full">
            <span className="font-bold">Demo</span>
          </div>
          <div>
            <p className="font-bold">Demo User</p>
            <p className="text-sm">This is a demo dashboard</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex justify-around md:block">
          <ul className="flex md:flex-col w-full gap-2 md:gap-4">
            <li className="w-full">
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">My Documents</span>
                <span className="md:hidden">Docs</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'activity'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Activity</span>
                <span className="md:hidden">Activity</span>
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-soft-sage border-b-4 border-deep-moss sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:h-20 flex flex-col md:flex-row gap-4 md:gap-0 md:items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-deep-moss mr-4">
                Individual Dashboard Demo
              </h2>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={handleConnectWallet}
                className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeTab === 'documents' && (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <div className="mb-6 p-4 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
                <h3 className="text-lg font-bold mb-2">Demo Dashboard</h3>
                <p className="mb-3">
                  This is a demo of the Individual Dashboard. Connect your wallet to access your personal dashboard.
                </p>
                <button
                  onClick={handleConnectWallet}
                  className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Connect Wallet
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-bold text-deep-moss">
                  My Documents
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex border-2 border-deep-moss">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${
                        viewMode === 'grid'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 ${
                        viewMode === 'table'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Table view"
                    >
                      <List size={20} />
                    </button>
                  </div>
                  <button
                    onClick={handleConnectWallet}
                    className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="hidden md:inline">Upload Document</span>
                  </button>
                </div>
              </div>

              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Demo Document Card 1 */}
                  <div className="bg-white border-2 border-deep-moss p-4 hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-deep-moss">Passport</h3>
                      <div className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold border border-green-800 rounded">
                        Verified
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Identity Document</p>
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>Uploaded: 01/15/2023</span>
                      <span>ID: #12345</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Eye size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <FileText size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Share2 size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <QrCode size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Demo Document Card 2 */}
                  <div className="bg-white border-2 border-deep-moss p-4 hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-deep-moss">Degree Certificate</h3>
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-bold border border-yellow-800 rounded">
                        Pending
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Education Document</p>
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>Uploaded: 02/20/2023</span>
                      <span>ID: #12346</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Eye size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <FileText size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Share2 size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <QrCode size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Demo Document Card 3 */}
                  <div className="bg-white border-2 border-deep-moss p-4 hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-deep-moss">Employment Contract</h3>
                      <div className="bg-green-100 text-green-800 px-2 py-1 text-xs font-bold border border-green-800 rounded">
                        Verified
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Employment Document</p>
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>Uploaded: 03/10/2023</span>
                      <span>ID: #12347</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Eye size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <FileText size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <Share2 size={18} />
                      </button>
                      <button className="p-1 text-deep-moss hover:bg-soft-sage rounded">
                        <QrCode size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {/* Demo Activity 1 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Check size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">Your Passport document has been verified by Ministry of Foreign Affairs</p>
                      <p className="text-sm text-gray-500">01/15/2023</p>
                    </div>
                  </div>
                  
                  {/* Demo Activity 2 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Bell size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">Your Degree Certificate is pending verification by University of Technology</p>
                      <p className="text-sm text-gray-500">02/20/2023</p>
                    </div>
                  </div>
                  
                  {/* Demo Activity 3 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Check size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">Your Employment Contract has been verified by TechCorp Inc.</p>
                      <p className="text-sm text-gray-500">03/10/2023</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Account Settings
                </h3>
                <div className="bg-ivory p-6 border-2 border-deep-moss">
                  <p className="text-deep-moss mb-4">
                    Connect your wallet to access your account settings.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default IndividualDashboardDemo;
