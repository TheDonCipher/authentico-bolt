import type { Document } from '../../types/dashboard';

interface StatsProps {
  documents: Document[];
}

export const Stats = ({ documents }: StatsProps) => {
  // Count documents by status, handling different status formats
  const countVerifiedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'verified';
    }).length;
  };

  const countPendingDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'pending' || status === 'pending verification';
    }).length;
  };

  const countRejectedDocuments = () => {
    return documents.filter((doc) => {
      const status = doc.status?.toLowerCase();
      return status === 'rejected';
    }).length;
  };

  // Log document statuses for debugging
  console.log(
    'Document statuses:',
    documents.map((doc) => doc.status)
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-ivory p-8 border-4 border-deep-moss hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Total Documents</h4>
          <p className="text-4xl font-black">{documents.length}</p>
        </div>
        <div className="bg-ivory p-8 border-4 border-deep-moss hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Verified</h4>
          <p className="text-4xl font-black text-green-700">
            {countVerifiedDocuments()}
          </p>
        </div>
        <div className="bg-ivory p-8 border-4 border-deep-moss hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Pending</h4>
          <p className="text-4xl font-black text-amber-600">
            {countPendingDocuments()}
          </p>
        </div>
        <div className="bg-ivory p-8 border-4 border-deep-moss hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Rejected</h4>
          <p className="text-4xl font-black text-red-700">
            {countRejectedDocuments()}
          </p>
        </div>
      </div>
    </div>
  );
};
