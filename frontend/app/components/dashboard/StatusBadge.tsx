import { Check, RefreshCw, X } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  // Map string status to numeric status for backward compatibility
  let statusKey = status;

  // Convert string statuses to numeric keys
  if (status === 'Verified' || status === '0') {
    statusKey = '0';
  } else if (
    status === 'Pending' ||
    status === 'Pending Verification' ||
    status === '1'
  ) {
    statusKey = '1';
  } else if (status === 'Rejected' || status === '2') {
    statusKey = '2';
  } else {
    // Default to pending if status is unknown
    statusKey = '1';
  }

  const statusConfig: Record<
    string,
    { bgColor: string; icon: React.FC<any>; text: string }
  > = {
    '0': { bgColor: 'bg-sap-green', icon: Check, text: 'Verified' },
    '1': { bgColor: 'bg-sunflower', icon: RefreshCw, text: 'Pending' },
    '2': { bgColor: 'bg-burnt-sienna', icon: X, text: 'Rejected' },
  };

  // Ensure statusKey is a valid key in statusConfig
  const validStatusKey = Object.keys(statusConfig).includes(statusKey)
    ? statusKey
    : '1';
  const {
    bgColor,
    icon: Icon,
    text: displayText,
  } = statusConfig[validStatusKey];

  return (
    <span
      className={`${bgColor} ${
        statusKey === '1' ? 'text-deep-moss' : 'text-ivory'
      } px-2 py-1 rounded-full flex items-center text-sm`}
    >
      <Icon size={14} className="mr-1" />
      {displayText}
    </span>
  );
};
