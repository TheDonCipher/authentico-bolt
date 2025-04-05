import type { Document } from '../../types/dashboard';

interface StatsProps {
  documents: Document[];
}

export const Stats = ({ documents }: StatsProps) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Total Documents</h4>
          <p className="text-4xl font-black">{documents.length}</p>
        </div>
        <div className="bg-white p-8 border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Verified Documents</h4>
          <p className="text-4xl font-black">
            {documents.filter((doc) => doc.status === 'verified').length}
          </p>
        </div>
        <div className="bg-white p-8 border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
          <h4 className="font-bold mb-2 text-xl">Pending Documents</h4>
          <p className="text-4xl font-black">
            {documents.filter((doc) => doc.status === 'pending').length}
          </p>
        </div>
      </div>
    </div>
  );
};
