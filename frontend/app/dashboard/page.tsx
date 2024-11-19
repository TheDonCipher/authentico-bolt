/* eslint-disable */
'use client'

import React, { useState, useEffect, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, List, LogOut, Plus, Check, X, Share2, Download, RefreshCw, Eye, User, HelpCircle, BarChart2 } from 'lucide-react';
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";

interface Document {
  id: number;
  name: string;
  status: string;
  similarity: number;
  verifyingOrg: string;
  rejectionReason?: string;
}

const StatusBadge = ({ status }: { status: 'verified' | 'pending' | 'rejected' }) => {
  const statusConfig = {
    verified: { bgColor: 'bg-green-500', icon: Check },
    pending: { bgColor: 'bg-yellow-500', icon: RefreshCw },
    rejected: { bgColor: 'bg-red-500', icon: X },
  };

  const { bgColor, icon: Icon } = statusConfig[status];

  return (
    <span className={`${bgColor} text-white px-2 py-1 rounded-full flex items-center text-sm`}>
      <Icon size={14} className="mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface Activity {
  id: number;
  text: string;
  date: string;
  icon: React.ReactNode;
}

const RecentActivity: React.FC<{ activities: Activity[] }> = ({ activities }) => (
  <div className="mt-4 bg-gray-800 p-4 border-4 border-white">
    <h4 className="font-bold mb-2">Recent Activity</h4>
    <ul className="text-sm">
      {activities.map((activity, index) => (
        <li key={index} className="mb-1 flex items-center">
          <span className="mr-2">{activity.icon}</span>
          <span>{activity.text} - {activity.date}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Omang - ID', status: 'verified', similarity: 85, verifyingOrg: 'Ministry of Nationality, Immigration and Gender Affairs' },
    { id: 2, name: 'Driving License', status: 'pending', similarity: 92, verifyingOrg: 'Ministry of Transport and Public Works' },
    { id: 3, name: 'Laptop Receipt', status: 'rejected', similarity: 78, verifyingOrg: 'Home Corp', rejectionReason: 'Incomplete information' },
  ]);

  const activeAccount = useActiveAccount();
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  useEffect(() => {
    if (!activeAccount) {
      // router.push('/');
    }
  }, [activeAccount, router]);

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map(doc => ({
      id: doc.id,
      text: `${doc.name} - ${doc.status}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      icon: doc.status === 'verified' ? <Check size={14} /> : doc.status === 'pending' ? <RefreshCw size={14} /> : <X size={14} />
    }));
    const sortedActivities = newActivities.sort((a, b) => b.id - a.id).slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map(doc => ({
      id: doc.id,
      text: `${doc.name} - ${doc.status}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      icon: doc.status === 'verified' ? <Check size={14} /> : doc.status === 'pending' ? <RefreshCw size={14} /> : <X size={14} />
    }));
    const sortedActivities = newActivities.sort((a, b) => b.id - a.id).slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  if (!activeAccount) {
    // return null;
  }
  // Function to display account status
  const formatAddress = (activeAccount: any) => {
    if (activeAccount) {
      return 'Connected'
    }
    return 'Not connected';
  };

  const handleSignOut = async () => {
    if (wallet) {
      await disconnect(wallet);
      // router.push('/');
    }
  };

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      docName: { value: string };
    };
    const newDoc = {
      id: documents.length + 1,
      name: target.docName.value,
      status: 'pending',
      similarity: Math.floor(Math.random() * 20) + 80,
      verifyingOrg: (event.target as any).verifyingOrg.value
    };
    setDocuments([...documents, newDoc]);
    setIsUploadDialogOpen(false);
  };

  /*   const handleShare = () => {
      if (selectedDocument) {
        // In a real application, you would generate a unique link here
        const shareLink = `https://authentico.com/share/${selectedDocument?.id}`;
        navigator.clipboard.writeText(shareLink)
          .then(() => {
            alert('Share link copied to clipboard!');
            setIsShareDialogOpen(false);
          })
          .catch((err) => {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy share link. Please try again.');
          });
      } else {
        console.error('No document selected for sharing');
      }
    }; */
  // TODO:move the avatar to the top corner
  // TODO:write the light mode equivalent
  // TODO:remove the whites
  // TODO:round up the cards
  // TODO:Statistics should be on the landing page
  // TODO: remove the your docs tag
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-indigo-900 p-6  md:border-b-0  flex flex-col h-screen">
        <h1 className="text-2xl font-black mb-8">AUTHENTICO</h1>
        {/* User Profile Section */}
        {/* <div className="mb-8 text-center flex items-center "> */}
        {/*   <div className="w-20 h-20 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center"> */}
        {/*     <User size={40} /> */}
        {/*   </div> */}
        {/*   <p className="font-bold">{formatAddress(activeAccount)}</p> */}
        {/* </div> */}

        {/* Navigation */}
        <nav className="mb-8">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-left p-2 border-4 border-white ${activeTab === 'documents' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}
              >
                <FileText className="inline-block mr-2" /> Documents
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('stats')}
                className={`w-full text-left p-2 border-4 border-white ${activeTab === 'stats' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}
              >
                <BarChart2 className="inline-block mr-2" /> Quick Stats
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-left p-2 border-4 border-white ${activeTab === 'activity' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}
              >
                <List className="inline-block mr-2" /> Activity
              </button>
            </li>
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="block w-full bg-gray-800 text-white p-2 font-black hover:bg-gray-700 transition duration-300 border-4 border-white text-center"
          >
            <LogOut className="inline-block mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 relative">
        <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 bg-indigo-800 p-4 border-8 border-white inline-block transform -rotate-2">
          {activeTab.toUpperCase()}
        </h2>

        {activeTab === 'documents' && (
          <div className="bg-gray-800 p-4 md:p-6 border-8 border-white">
            <h3 className="text-xl md:text-2xl font-black mb-4">Your Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-700 p-6 border-4 border-white flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-lg">{doc.name}</span>
                    <StatusBadge status={doc.status as "verified" | "pending" | "rejected"} />
                  </div>
                  <p className="text-sm text-gray-300 mb-2">Verifying Org: {doc.verifyingOrg}</p>
                  <div className="mb-4">
                    <p className="text-sm mb-1">Similarity to common documents:</p>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${doc.similarity}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm mt-1">{doc.similarity}%</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {doc.status === 'pending' && (
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition flex items-center">
                        <RefreshCw size={16} className="mr-2" /> Check Status
                      </button>
                    )}
                    {doc.status === 'verified' && (
                      <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition flex items-center">
                        <Download size={16} className="mr-2" /> Download
                      </button>
                    )}
                    {doc.status === 'rejected' && (
                      <>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition flex items-center"
                          onClick={() => alert(`Rejection Reason: ${doc.rejectionReason}`)}>
                          <Eye size={16} className="mr-2" /> View Reason
                        </button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition flex items-center">
                          <RefreshCw size={16} className="mr-2" /> Re-upload
                        </button>
                      </>
                    )}
                    <button
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition flex items-center ml-auto"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setIsShareDialogOpen(true);
                      }}
                    >
                      <Share2 size={16} className="mr-2" /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-gray-800 p-6 border-8 border-white">
            <h3 className="text-2xl font-black mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-700 p-4 border-4 border-white">
                <h4 className="font-bold mb-2">Total Documents</h4>
                <p className="text-3xl font-black">{documents.length}</p>
              </div>
              <div className="bg-green-700 p-4 border-4 border-white">
                <h4 className="font-bold mb-2">Verified Documents</h4>
                <p className="text-3xl font-black">{documents.filter(doc => doc.status === 'verified').length}</p>
              </div>
              <div className="bg-yellow-700 p-4 border-4 border-white">
                <h4 className="font-bold mb-2">Pending Documents</h4>
                <p className="text-3xl font-black">{documents.filter(doc => doc.status === 'pending').length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-gray-800 p-6 border-8 border-white">
            <h3 className="text-2xl font-black mb-4">Recent Activity</h3>
            <ul className="space-y-2">
              {activities.map((activity, index) => (
                <li key={index} className="bg-gray-700 p-4 border-4 border-white flex items-center">
                  <span className="mr-4">{activity.icon as React.ReactNode}</span>
                  <div>
                    <p className="font-bold">{activity.text as string}</p>
                    <p className="text-sm text-gray-400">{activity.date as string}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Floating Add Document Button */}
        <button
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 transition shadow-lg border-4 border-white"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <Plus size={24} />
        </button>
      </main>

      {/* Upload Dialog */}
      {isUploadDialogOpen && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 border-8 border-white max-w-md w-full">
            <h3 className="text-2xl font-black mb-4">Upload New Document</h3>
            <form onSubmit={handleUpload}>
              <input type="text" name="docName" placeholder="Document Name" className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white" required />
              <input type="text" name="verifyingOrg" placeholder="Verifying Organization" className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white" required />
              <div className="flex justify-end">
                <button type="button" onClick={() => setIsUploadDialogOpen(false)} className="mr-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {isShareDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 border-8 border-white max-w-md w-full">
            <h3 className="text-2xl font-black mb-4">Share Document</h3>
            <p className="mb-4">Are you sure you want to share this document?</p>
            <div className="flex justify-end">
              <button onClick={() => setIsShareDialogOpen(false)} className="mr-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">Cancel</button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
