import { Document } from '../../types/dashboard';
import { StatusBadge } from './StatusBadge';

interface DocumentCardProps {
  doc: Document;
  onShare: (doc: Document) => void;
  onAction: (doc: Document) => void;
}

export const DocumentCard = ({ doc, onShare, onAction }: DocumentCardProps) => (
  <div className="bg-white p-4 md:p-6 border-2 md:border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-rotate-1">
    <div className="flex justify-between items-start mb-4">
      <h4 className="font-bold text-xl">{doc.documentType}</h4>
      <StatusBadge status={doc.status as '0' | '1' | '2'} />
    </div>

    <div className="mb-4">

      <div className="flex items-center gap-1">

        <p>{doc.verifier.slice(0, 5)}... {doc.verifier.slice(-3)}</p>
      </div>

    </div>

    <div className="flex flex-wrap gap-2 mt-4">
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
