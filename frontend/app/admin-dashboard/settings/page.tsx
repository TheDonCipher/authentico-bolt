'use client';

import React, { useState } from 'react';
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
  Save,
  RefreshCw
} from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  
  // Settings state
  const [adminWalletAddress, setAdminWalletAddress] = useState(process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // In a real implementation, you would save these settings to your backend
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage({
        type: 'success',
        message: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
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
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <FileText size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Documents</span>
                </div>
              </Link>
              
              <Link href="/admin-dashboard/settings">
                <div className="flex items-center gap-3 px-4 py-3 bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal">
                  <Settings size={20} className="text-ivory" />
                  <span className="font-bold">Settings</span>
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
                  Admin Settings
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
                  System Settings
                </h3>
                <p className="text-deep-moss mb-6">
                  Configure system-wide settings for the Authentico platform.
                </p>
                
                <div className="bg-white p-6 border-2 border-deep-moss mb-6">
                  <h4 className="text-xl font-bold mb-4 text-deep-moss">
                    Admin Configuration
                  </h4>
                  
                  <div className="mb-4">
                    <label className="block text-deep-moss font-bold mb-2">
                      Admin Wallet Address
                    </label>
                    <input
                      type="text"
                      value={adminWalletAddress}
                      onChange={(e) => setAdminWalletAddress(e.target.value)}
                      className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none font-mono"
                      placeholder="0x..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This wallet address will have admin privileges in the system.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setAdminWalletAddress(process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '')}
                      className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
                      disabled={isSaving}
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Reset
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      className="bg-forest-green text-white px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white p-6 border-2 border-deep-moss">
                  <h4 className="text-xl font-bold mb-4 text-deep-moss">
                    System Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-500">Version</p>
                      <p className="text-deep-moss">1.0.0</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">Environment</p>
                      <p className="text-deep-moss">{process.env.NODE_ENV}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">Blockchain Network</p>
                      <p className="text-deep-moss">Sepolia Testnet</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">IPFS Gateway</p>
                      <p className="text-deep-moss">fuchsia-fantastic-python-686.mypinata.cloud</p>
                    </div>
                  </div>
                </div>
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
