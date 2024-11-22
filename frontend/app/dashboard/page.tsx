/* eslint-disable */
"use client";

import React, { useState, useEffect, SetStateAction } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
} from "thirdweb/react";
import {
  BellIcon,
  DocumentIcon,
  PendingDocumentsIcon,
  UserIcon,
  VerifiedDocsIcon,
} from "app/svg";

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
  status: "verified" | "pending" | "rejected";
}) => {
  const statusConfig = {
    verified: { bgColor: "bg-green-500", icon: Check },
    pending: { bgColor: "bg-yellow-500", icon: RefreshCw },
    rejected: { bgColor: "bg-red-500", icon: X },
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
  <div className="mt-4 bg-gray-800 p-4 border-4 border-white">
    <h4 className="font-bold mb-2">Recent Activity</h4>
    <ul className="text-sm">
      {activities.map((activity, index) => (
        <li key={index} className="mb-1 flex items-center">
          <span className="mr-2">{activity.icon}</span>
          <span>
            {activity.text} - {activity.date}
          </span>
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
    rejectionReason: string,
  ) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.similarity = similarity;
    this.Verifyingorg = Verifyingorg;
  }
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("documents");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );

  function gotoActivityPane() {
    setActiveTab("activity");
  }
  const [documents, setDocuments] = useState<Document[]>([
    new Document(
      1,
      "Omang - ID",
      "verified",
      85,
      "Ministry of Nationality, Immigration and Gender Affairs",
      "Incomplete information",
    ),
    new Document(
      2,
      "Driving License",
      "pending",
      92,
      "Ministry of Transport and Public Works",
      "Fuzzy image",
    ),
    new Document(
      3,
      "Laptop Receipt",
      "rejected",
      78,
      "Home Corp",
      "Incomplete information",
    ),
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
    const newActivities = documents.map((doc) => ({
      id: doc.id,
      text: `${doc.name} - ${doc.status}`,
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ).toLocaleDateString(),
      icon:
        doc.status === "verified" ? (
          <Check size={14} />
        ) : doc.status === "pending" ? (
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
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ).toLocaleDateString(),
      icon:
        doc.status === "verified" ? (
          <Check size={14} />
        ) : doc.status === "pending" ? (
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
    if (activeAccount) {
      return "Connected";
    }
    return "Not connected";
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
      "pending",
      Math.floor(Math.random() * 20) + 80,
      (event.target as any).verifyingOrg.value,
      "fuzzy images",
    );
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
  // TODO:write the light mode equivalent
  // HACK: Downloading will not be implemented yet becuase it has not set to return
  // TODO:deleting docs
  // TODO:Resposive design
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
                onClick={() => setActiveTab("documents")}
                className={`w-full text-left p-2 rounded-md ${activeTab === "documents" ? "bg-indigo-700" : "tranparent hover:bg-indigo-800"}`}
              >
                <FileText className="inline-block mr-2" /> Documents
              </button>
            </li>
            <li>
              {/**/}
              {/* <button */}
              {/*   onClick={() => setActiveTab("stats")} */}
              {/*   className={`w-full text-left p-2 rounded-md  ${activeTab === "stats" ? "bg-indigo-700" : "transparent hover:bg-indigo-800"}`} */}
              {/* > */}
              {/*   <BarChart2 className="inline-block mr-2" /> Quick Stats */}
              {/* </button> */}
            </li>
            <li>
              <button
                onClick={() => setActiveTab("activity")}
                className={`w-full text-left p-2 rounded-md  ${activeTab === "activity" ? "bg-indigo-700 " : "tranparent hover:bg-indigo-800"}`}
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
      <div className="w-screen grid grid-cols-4 grid-rows-8 h-screen">
        <AvatarTab activities={activities} openActivity={gotoActivityPane} />
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto -row-end-1 p-4 col-start-1 row-start-2 col-end-5  md:p-8 relative">
          {/* <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 bg-indigo-800 p-4 border-8 border-white inline-block transform -rotate-2"> */}
          {/*   {activeTab.toUpperCase()} */}
          {/* </h2> */}

          {activeTab === "documents" && (
            <div className="p-4 md:p-6  flex flex-col gap-8">
              <Stats documents={documents} />
              <div>
                <h3 className="text-xl md:text-2xl font-black mb-4">
                  Your Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-700 p-6 rounded-md flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-lg">{doc.name}</span>
                        <StatusBadge
                          status={
                            doc.status as "verified" | "pending" | "rejected"
                          }
                        />
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        Verifying Org: {doc.verifyingOrg}
                      </p>
                      <div className="mb-4">
                        <p className="text-sm mb-1">
                          Similarity to common documents:
                        </p>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${doc.similarity}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-sm mt-1">
                          {doc.similarity}%
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {doc.status === "pending" && (
                          <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition flex items-center">
                            <RefreshCw size={16} className="mr-2" /> Check
                            Status
                          </button>
                        )}
                        {doc.status === "verified" && (
                          <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition flex items-center">
                            <Download size={16} className="mr-2" /> Download
                          </button>
                        )}
                        {doc.status === "rejected" && (
                          <>
                            <button
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition flex items-center"
                              onClick={() =>
                                alert(
                                  `Rejection Reason: ${doc.rejectionReason}`,
                                )
                              }
                            >
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
            </div>
          )}

          {activeTab === "stats" && (
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
                    {
                      documents.filter((doc) => doc.status === "verified")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-yellow-700 p-4 border-4 border-white">
                  <h4 className="font-bold mb-2">Pending Documents</h4>
                  <p className="text-3xl font-black">
                    {documents.filter((doc) => doc.status === "pending").length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="bg-gray-800 p-6 ">
              <h3 className="text-2xl font-black mb-4">Recent Activity</h3>
              <ul className="space-y-2">
                {activities.map((activity, index) => (
                  <li
                    key={index}
                    className="bg-gray-700 rounded-md p-4 flex items-center"
                  >
                    <span className="mr-4">
                      {activity.icon as React.ReactNode}
                    </span>
                    <div>
                      <p className="font-bold">{activity.text as string}</p>
                      <p className="text-sm text-gray-400">
                        {activity.date as string}
                      </p>
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
      </div>
      {/* Upload Dialog */}
      {isUploadDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded shadow-lg shadow-black max-w-md w-full">
            <h3 className="text-2xl font-black mb-4">Upload New Document</h3>
            <form onSubmit={handleUpload}>
              <input
                type="text"
                name="docName"
                placeholder="Document Name"
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
                  className="mr-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
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
          <div className="bg-gray-800 p-6 border-8 border-white max-w-md w-full">
            <h3 className="text-2xl font-black mb-4">Share Document</h3>
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
  let verifiedDocsNum =
    documents.filter((doc) => doc.status === "verified").length + "+";

  return (
    <div>
      <h3 className="text-2xl font-black mb-4">Quick Stats</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1f2937] p-8 rounded-md  flex justify-between gap-3 items-center">
          <div>
            <h4 className="font-bold mb-2">Total Documents</h4>
            <p className="text-3xl font-black">
              {documents.length > 0 ? documents.length + "+" : "0"}
            </p>
          </div>
          <StatIcon children={<DocumentIcon />} color={"cyan"} />
        </div>
        <div className="bg-[#1f2937] p-8 rounded-md  flex justify-between gap-3 items-center">
          <div>
            <h4 className="font-bold mb-2">Verified Documents</h4>

            <p className="text-3xl font-black">
              {documents.filter((doc) => doc.status === "verified").length +
                "+"}
            </p>
          </div>
          <StatIcon children={<VerifiedDocsIcon />} color={"green"} />
        </div>

        <div className="bg-[#1f2937] p-8 rounded-md  flex justify-between gap-3 items-center">
          <div>
            <h4 className="font-bold mb-2">Pending Documents</h4>
            <p className="text-3xl font-black">
              {documents.filter((doc) => doc.status === "pending").length + "+"}
            </p>
          </div>
          <StatIcon children={<PendingDocumentsIcon />} color={"orange"} />
        </div>
      </div>
    </div>
  );
}

function AvatarTab(props) {
  return (
    <div className="bg-[#312e81] gap-20 col-start-1 col-end-5 px-6 h-14 flex justify-between">
      <SearchBar />
      <div className="flex gap-4 items-center">
        <button onClick={props.openActivity}>
          <div className="flex  items-center">
            <BellIcon />
            <sup className="bg-[#ef4444] h-0.5 w-0.5 relative -top-3 right-4 text-white rounded-full p-3 flex justify-center items-center text-sm">
              <p>{props.activities.length}</p>
            </sup>
          </div>
        </button>

        <div className="gap-2 text-center flex items-center ">
          <div className="w-15 h-15 rounded-full bg-gray-700 flex items-center justify-center">
            <UserIcon />
          </div>
          {/* <p className="font-bold">{formatAddress(activeAccount)}</p> */}
          <p className="font-bold">Jeff Austinburg</p>
        </div>
      </div>
    </div>
  );
}
function SearchBar() {
  return (
    <>
      <div className="flex flex-1 w-1/2 items-center gap-2">
        <input
          className="flex-1 h-8 p-3  rounded-md  "
          placeholder="Search Document"
        />
        <button>
          <SearchIcon />
        </button>
      </div>
    </>
  );
}

function StatIcon(props) {
  let color =
    props.color == "green"
      ? "bg-green-300"
      : props.color == "cyan"
        ? "bg-cyan-300"
        : "bg-orange-300";
  return (
    <div className="flex">
      <div className="relative left-12 top-4 z-20">{props.children}</div>
      <div
        className={"flex opacity-50 " + color + " w-16 h-16 rounded-full p-3"}
      ></div>
    </div>
  );
}

export default Dashboard;
