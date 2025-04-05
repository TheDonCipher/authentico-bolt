import { Check, RefreshCw, X } from 'lucide-react';
import { text } from 'stream/consumers';

interface StatusBadgeProps {
  status: '0' | '1' | '2';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    0: { bgColor: 'bg-[#698B69]', icon: Check, text: 'Verified', },
    1: { bgColor: 'bg-[#8B7355]', icon: RefreshCw, text: 'Pending' },
    2: { bgColor: 'bg-[#B87070]', icon: X, text: 'Rejected' },
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
