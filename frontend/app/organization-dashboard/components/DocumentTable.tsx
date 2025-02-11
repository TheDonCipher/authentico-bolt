import React from 'react';

interface Document {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  documents: Document[];
}

export default function DocumentTable({
  documents,
}: {
  documents: Document[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-4 border-[#4A5043] bg-[#F5F5F0]">
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Document
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Status
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Created
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Updated
            </th>
            <th className="px-4 py-3 text-left font-black text-[#2C3639]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="border-b-2 border-[#4A5043] hover:bg-[#F5F5F0]"
            >
              <td className="px-4 py-4 font-medium text-[#2C3639]">
                {doc.name}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 text-sm font-bold border-2 border-[#4A5043]
                  ${
                    doc.status === 'verified'
                      ? 'bg-[#E8EFE6] text-[#4A6741]'
                      : doc.status === 'pending'
                      ? 'bg-[#F2EBE3] text-[#8B7355]'
                      : 'bg-[#F5E6E8] text-[#A65D57]'
                  }`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-4 text-[#2C3639]">{doc.createdAt}</td>
              <td className="px-4 py-4 text-[#2C3639]">{doc.updatedAt}</td>
              <td className="px-4 py-4">
                <button className="bg-[#4A5043] text-white px-4 py-2 font-bold hover:bg-[#5C6354] transition-colors border-2 border-[#4A5043]">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
