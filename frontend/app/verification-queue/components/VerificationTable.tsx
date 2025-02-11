import React from 'react';

interface Verification {
  id: number;
  documentName: string;
  submittedBy: string;
  submittedAt: string;
  documentType: string;
}

interface VerificationTableProps {
  verifications: Verification[];
}

const VerificationTable = ({ verifications }: VerificationTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b-2 border-[#4A5043]">
            <th className="text-left py-3 text-[#2C3639]">Document Name</th>
            <th className="text-left py-3 text-[#2C3639]">Submitted By</th>
            <th className="text-left py-3 text-[#2C3639]">Submitted At</th>
            <th className="text-left py-3 text-[#2C3639]">Document Type</th>
            <th className="text-right py-3 text-[#2C3639]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((verification) => (
            <tr key={verification.id} className="border-b border-[#4A5043]/20">
              <td className="py-4 text-[#2C3639]">
                {verification.documentName}
              </td>
              <td className="py-4 text-[#2C3639]">
                {verification.submittedBy}
              </td>
              <td className="py-4 text-[#2C3639]">
                {verification.submittedAt}
              </td>
              <td className="py-4 text-[#2C3639]">
                {verification.documentType}
              </td>
              <td className="py-4 text-right">
                <button className="bg-[#4A5043] text-white px-4 py-2 text-sm font-bold hover:bg-[#5A6053] mr-2">
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VerificationTable;
