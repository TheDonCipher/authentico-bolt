'use client';

import React from 'react';
import { Bell, Check, X, AlertCircle } from 'lucide-react';

interface DocumentNotificationProps {
  documentId: string;
  documentName: string;
  status: string;
  timestamp: Date;
  isNew?: boolean;
}

export const DocumentNotification = ({
  documentId,
  documentName,
  status,
  timestamp,
  isNew = false,
}: DocumentNotificationProps) => {
  // Format the timestamp
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(timestamp);

  // Determine the icon and color based on status
  let Icon = Bell;
  let iconColor = 'text-forest-green';
  let bgColor = 'bg-soft-sage';
  let borderColor = 'border-forest-green';

  switch (status) {
    case 'Verified':
      Icon = Check;
      iconColor = 'text-forest-green';
      bgColor = 'bg-soft-sage bg-opacity-50';
      borderColor = 'border-forest-green';
      break;
    case 'Rejected':
      Icon = X;
      iconColor = 'text-burnt-sienna';
      bgColor = 'bg-burnt-sienna bg-opacity-20';
      borderColor = 'border-burnt-sienna';
      break;
    case 'Pending Verification':
    case 'Pending Blockchain Submission':
    case 'Submitting to Blockchain':
      Icon = Bell;
      iconColor = 'text-sunflower-yellow';
      bgColor = 'bg-sunflower-yellow bg-opacity-20';
      borderColor = 'border-deep-moss';
      break;
    case 'Blockchain Failed':
    case 'Verification Failed':
      Icon = AlertCircle;
      iconColor = 'text-burnt-sienna';
      bgColor = 'bg-burnt-sienna bg-opacity-20';
      borderColor = 'border-burnt-sienna';
      break;
    default:
      Icon = Bell;
      iconColor = 'text-forest-green';
      bgColor = 'bg-soft-sage';
      borderColor = 'border-forest-green';
  }

  return (
    <div
      className={`p-4 mb-3 border-2 ${borderColor} ${bgColor} ${
        isNew ? 'shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]' : ''
      }`}
    >
      <div className="flex items-start">
        <div className={`${iconColor} mr-3 mt-1 flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="flex-grow">
          <p className="font-bold text-deep-moss">{documentName}</p>
          <p className="text-sm text-deep-moss">
            Status: <span className="font-medium">{status}</span>
          </p>
          <p className="text-xs text-deep-moss mt-1">{formattedTime}</p>
        </div>
        {isNew && (
          <div className="ml-2 bg-forest-green text-ivory text-xs px-2 py-1 rounded-sm">
            NEW
          </div>
        )}
      </div>
    </div>
  );
};
