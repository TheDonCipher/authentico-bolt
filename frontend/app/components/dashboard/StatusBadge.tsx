import { Check, RefreshCw, X } from 'lucide-react';

interface StatusBadgeProps {
  status: 'verified' | 'pending' | 'rejected';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
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
