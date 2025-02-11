/* eslint-disable */
'use client';

import React, { useState, useEffect, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  List,
  LogOut,
  Plus,
  Check,
  X,
  Share2,
  Download,
  RefreshCw,
  Eye,
  User,
  HelpCircle,
  BarChart2,
  SearchIcon,
} from 'lucide-react';
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
} from 'thirdweb/react';
import {
  BellIcon,
  DocumentIcon,
  PendingDocumentsIcon,
  UserIcon,
  VerifiedDocsIcon,
} from 'app/svg';

interface Document {
  id: number;
  name: string;
  status: string;
  similarity: number;
  verifyingOrg: string;
  rejectionReason?: string;
}

const StatusBadge = ({
  status,
}: {
  status: 'verified' | 'pending' | 'rejected';
}) => {
  const statusConfig = {
    verified: { bgColor: 'bg-[#698B69]', icon: Check },
    pending: { bgColor: 'bg-[#8B7355]', icon: RefreshCw },
    rejected: { bgColor: 'bg-[#B87070]', icon: X },
  };

  const { bgColor, icon: Icon } = statusConfig[status];

  return (
    <span
      className={`${bgColor} text-white px-2 py-1 rounded-full flex items-center text-sm`}
    >
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

const RecentActivity: React.FC<{ activities: Activity[] }> = ({
  activities,
}) => (
  <div className="mt-4 bg-white p-4 border-4 border-black">
    <h4 className="text-2xl font-black mb-4 text-black">Recent Activity</h4>
    <ul className="space-y-3">
      {activities.map((activity, index) => (
        <li
          key={index}
          className="bg-[#F0EAD6] p-4 border-2 border-black flex items-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <span className="mr-4 p-2 bg-[#fef29f] border-2 border-black rounded">
            {activity.icon}
          </span>
          <div>
            <p className="font-bold text-black">{activity.text}</p>
            <p className="text-sm text-gray-600">{activity.date}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

class Document {
  id: number;
  name: string;
  status: string;
  similarity: number;
  Verifyingorg: string;
  constructor(
    id: number,
    name: string,
    status: string,
    similarity: number,
    Verifyingorg: string,
    rejectionReason: string
  ) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.similarity = similarity;
    this.Verifyingorg = Verifyingorg;
  }
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  function gotoActivityPane() {
    setActiveTab('activity');
  }
  let defaulDocs = [
    new Document(
      1,
      'Omang - ID',
      'verified',
      85,
      'Ministry of Nationality, Immigration and Gender Affairs',
      'Incomplete information'
    ),
    new Document(
      2,
      'Driving License',
      'pending',
      92,
      'Ministry of Transport and Public Works',
      'Fuzzy image'
    ),
    new Document(
      3,
      'Laptop Receipt',
      'rejected',
      78,
      'Home Corp',
      'Incomplete information'
    ),
  ];
  const [documents, setDocuments] = useState<Document[]>(defaulDocs);
  // const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    // Remove localStorage retrieval logic
    // if (typeof window !== "undefined") {
    //   const storedDocuments = localStorage.getItem("documents");
    //   if (storedDocuments) {
    //     setDocuments(JSON.parse(storedDocuments));
    //   } else {
    //     setDocuments(defaulDocs);
    //   }
    // }
  }, []);

  const activeAccount = useActiveAccount();
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let account = localStorage.getItem('account');
      // Remove localStorage retrieval logic
      // if (typeof window !== "undefined") {
      //   const account = localStorage.getItem("account");
      //   // Comment out the redirection to allow access without signing in, for demo purposes
      //   // if (!(account == "true")) {
      //   //   router.push("/");
      //   // }
      // }
    }
  }, []);

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map((doc) => ({
      id: doc.id,
      text: `${doc.name} - ${doc.status}`,
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toLocaleDateString(),
      icon:
        doc.status === 'verified' ? (
          <Check size={14} />
        ) : doc.status === 'pending' ? (
          <RefreshCw size={14} />
        ) : (
          <X size={14} />
        ),
    }));
    const sortedActivities = newActivities
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map((doc) => ({
      id: doc.id,
      text: `${doc.name} - ${doc.status}`,
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toLocaleDateString(),
      icon:
        doc.status === 'verified' ? (
          <Check size={14} />
        ) : doc.status === 'pending' ? (
          <RefreshCw size={14} />
        ) : (
          <X size={14} />
        ),
    }));
    const sortedActivities = newActivities
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  if (!activeAccount) {
    // return null;
  }
  // Function to display account status
  const formatAddress = (activeAccount: any) => {
    if (typeof window !== 'undefined' && activeAccount) {
      return 'Connected';
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
    const newDoc = new Document(
      documents.length + 1,
      target.docName.value,
      'pending',
      Math.floor(Math.random() * 20) + 80,
      (event.target as any).verifyingOrg.value,
      'fuzzy images'
    );
    setDocuments([...documents, newDoc]);
    setIsUploadDialogOpen(false);
  };
  //TODO: uncomment code of functionality
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
  // TODO:write the light mode equivalent
  // HACK: Downloading will not be implemented yet becuase it has not set to return
  // TODO:deleting docs
  // TODO:Resposive design
  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col md:flex-row font-archivo">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#E8EDE1] p-6 border-r-4 border-[#556B2F] md:border-b-0 flex flex-col h-screen sticky top-0">
        <h1 className="text-2xl font-black mb-8 text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block">
          AUTHENTICO
        </h1>

        {/* Navigation */}
        <nav className="mb-8">
          <ul className="space-y-4">
            {/* Replace existing nav buttons with neubrutalist style */}
            <li>
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-left p-3 border-4 border-[#556B2F] font-bold ${
                  activeTab === 'documents'
                    ? 'bg-[#D2E3C8] shadow-[4px_4px_0px_0px_rgba(85,107,47,1)]'
                    : 'bg-white hover:bg-[#D2E3C8] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)]'
                }`}
              >
                <FileText className="inline-block mr-2" /> Documents
              </button>
            </li>
            {/* ...similar styling for other nav items... */}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="block w-full bg-[#E6B8AF] text-[#2F4F4F] p-3 font-bold border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all"
          >
            <LogOut className="inline-block mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <AvatarTab activities={activities} openActivity={gotoActivityPane} />

        {/* Main Content Area with Proper Scroll */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#F0F4F8]">
          {activeTab === 'documents' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <Stats documents={documents} />
              <div>
                <h3 className="text-xl md:text-2xl font-archivo font-bold mb-4">
                  Your Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents &&
                    documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onShare={() => {
                          setSelectedDocument(doc);
                          setIsShareDialogOpen(true);
                        }}
                        onAction={(doc) => {
                          if (doc.status === 'pending') {
                            // Handle check status
                          } else if (doc.status === 'verified') {
                            // Handle download
                          } else if (doc.status === 'rejected') {
                            alert(`Rejection Reason: ${doc.rejectionReason}`);
                          }
                        }}
                      />
                    ))}
                </div>
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
                  <p className="text-3xl font-black">
                    {documents &&
                      documents.filter((doc) => doc.status === 'verified')
                        .length}
                  </p>
                </div>
                <div className="bg-yellow-700 p-4 border-4 border-white">
                  <h4 className="font-bold mb-2">Pending Documents</h4>
                  <p className="text-3xl font-black">
                    {documents &&
                      documents.filter((doc) => doc.status === 'pending')
                        .length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white p-6 border-4 border-black">
              <h3 className="text-2xl font-black mb-6 bg-[#fef29f] p-2 border-4 border-black inline-block -rotate-2">
                Recent Activity
              </h3>
              <ul className="space-y-4">
                {activities.map((activity, index) => (
                  <li
                    key={index}
                    className="bg-[#F0EAD6] p-4 border-2 border-black flex items-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <span className="mr-4 p-2 bg-[#fef29f] border-2 border-black rounded">
                      {activity.icon}
                    </span>
                    <div>
                      <p className="font-bold text-black">{activity.text}</p>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Floating Add Document Button */}
          <button
            className="fixed bottom-8 right-8 bg-[#D2E3C8] text-[#2F4F4F] p-4 rounded-full border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Plus size={24} />
          </button>
        </main>
      </div>

      {/* Upload Dialog */}
      {isUploadDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 border-8 border-black max-w-md w-full transform rotate-1">
            <h3 className="text-2xl font-black mb-6 bg-[#D2E3C8] p-2 border-4 border-black inline-block -rotate-2">
              Upload Document
            </h3>
            <form onSubmit={handleUpload}>
              <input
                type="text"
                name="docName"
                placeholder="Document Name"
                className="w-full p-2 mb-4 bg-stone-100 border border-stone-300 text-stone-800 rounded-md"
                required
              />

              <input
                type="file"
                name="Document"
                placeholder="Document"
                className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white"
                required
              />
              <input
                type="text"
                name="verifyingOrg"
                placeholder="Verifying Organization"
                className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white"
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsUploadDialogOpen(false)}
                  className="mr-2 bg-stone-400 text-white px-4 py-2 rounded hover:bg-stone-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#698B69] text-white px-4 py-2 rounded hover:bg-[#8B7355] transition"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {isShareDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#F0EAD6] p-6 rounded-lg shadow-xl max-w-md w-full border-2 border-[#2C3E50]">
            <h3 className="text-2xl font-bold mb-4 text-[#2C3E50]">
              Share Document
            </h3>
            <p className="mb-4">
              Are you sure you want to share this document?
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsShareDialogOpen(false)}
                className="mr-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
interface Idocuments {
  documents: Array<Document>;
}
function Stats({ documents }: Idocuments) {
  return (
    <div className="relative transform -rotate-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform rotate-1">
          <h4 className="font-bold mb-2 text-xl">Total Documents</h4>
          <p className="text-4xl font-black">{documents.length}+</p>
          <div className="absolute top-2 right-2">
            <span className="w-6 h-6 text-[#D2E3C8]">
              <DocumentIcon />
            </span>
          </div>
        </div>
        {/* ...similar styling for other stat boxes... */}
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="flex items-center gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <input
          className="w-full h-12 pl-4 pr-12 bg-white border-4 border-[#556B2F] focus:outline-none focus:ring-4 ring-[#D2E3C8] font-bold placeholder:text-gray-500"
          placeholder="Search documents..."
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2">
          <SearchIcon
            size={20}
            className="text-gray-500 hover:text-[#2F4F4F] transition-colors"
          />
        </button>
      </div>
      <button className="h-12 w-12 flex items-center justify-center bg-[#D2E3C8] border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all transform hover:-translate-y-[2px] hover:-translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px]">
        <Plus size={20} />
      </button>
    </div>
  );
}

function AvatarTab(props) {
  return (
    <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
        <SearchBar />
        <div className="flex items-center gap-6">
          <NotificationBell
            count={props.activities.length}
            onClick={props.openActivity}
          />
          <ProfileCard />
        </div>
      </div>
    </header>
  );
}

function NotificationBell({ count, onClick }) {
  return (
    <button onClick={onClick} className="relative group">
      <div className="p-3 bg-[#D2E3C8] border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all transform hover:-translate-y-[2px] hover:-translate-x-[2px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#2F4F4F]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#556B2F] text-[#D2E3C8] rounded-full flex items-center justify-center text-sm font-bold border-2 border-[#D2E3C8]">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

function ProfileCard() {
  return (
    <div className="flex items-center gap-3 p-2 bg-white border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all">
      <div className="w-12 h-12 bg-[#D2E3C8] border-4 border-[#556B2F] rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#2F4F4F]"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex flex-col pr-2">
        <span className="font-bold text-[#2F4F4F]">
          {typeof window !== 'undefined'
            ? localStorage.getItem('name')
            : 'User'}
        </span>
        <span className="text-xs text-gray-600">Individual Account</span>
      </div>
    </div>
  );
}

// Add neubrutalist document card component
function DocumentCard({ doc, onShare, onAction }) {
  return (
    <div className="bg-white p-6 border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-rotate-1">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-xl">{doc.name}</h4>
        <StatusBadge status={doc.status} />
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-200 h-3 border-2 border-black">
          <div
            className="bg-[#D2E3C8] h-full border-r-2 border-black"
            style={{ width: `${doc.similarity}%` }}
          />
        </div>
        <p className="text-right mt-1 font-bold">{doc.similarity}% Match</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {/* Action buttons with consistent neubrutalist style */}
        <button
          className="bg-[#D2E3C8] px-4 py-2 border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
          onClick={() => onAction(doc)}
        >
          {doc.status === 'pending' && 'Check Status'}
          {doc.status === 'verified' && 'Download'}
          {doc.status === 'rejected' && 'View Reason'}
        </button>

        <button
          className="bg-white px-4 py-2 border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold ml-auto"
          onClick={() => onShare(doc)}
        >
          Share
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
