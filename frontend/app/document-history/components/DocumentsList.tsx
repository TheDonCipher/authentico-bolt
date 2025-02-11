import React from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'rejected';
  sender: string;
  receivedDate: string;
  fileSize: string;
}

interface DocumentsListProps {
  documents: Document[];
}

const DocumentsList = ({ documents }: DocumentsListProps) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-[#4A6741]/20 border-[#4A6741] text-[#4A6741]';
      case 'pending':
        return 'bg-[#8B7355]/20 border-[#8B7355] text-[#8B7355]';
      case 'rejected':
        return 'bg-[#A14343]/20 border-[#A14343] text-[#A14343]';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b-2 border-[#4A5043]">
            <th className="text-left py-3 text-[#2C3639]">Document Name</th>
            <th className="text-left py-3 text-[#2C3639]">Type</th>
            <th className="text-left py-3 text-[#2C3639]">Status</th>
            <th className="text-left py-3 text-[#2C3639]">Sender</th>
            <th className="text-left py-3 text-[#2C3639]">Received Date</th>
            <th className="text-left py-3 text-[#2C3639]">Size</th>
            <th className="text-right py-3 text-[#2C3639]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-[#4A5043]/20">
              <td className="py-4 text-[#2C3639] font-medium">{doc.name}</td>
              <td className="py-4 text-[#2C3639]">{doc.type}</td>
              <td className="py-4">
                <span
                  className={`px-3 py-1 border-2 inline-block ${getStatusStyles(
                    doc.status
                  )}`}
                >
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
              </td>
              <td className="py-4 text-[#2C3639]">{doc.sender}</td>
              <td className="py-4 text-[#2C3639]">{doc.receivedDate}</td>
              <td className="py-4 text-[#2C3639]">{doc.fileSize}</td>
              <td className="py-4 text-right">
                <button className="bg-[#4A5043] text-white px-4 py-2 text-sm font-bold hover:bg-[#5A6053]">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsList;
