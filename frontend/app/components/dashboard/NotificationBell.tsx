import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count: number;
  onClick?: () => void;
  notificationsPath?: string; // Path to notifications page
}

export const NotificationBell = ({
  count,
  onClick,
  notificationsPath,
}: NotificationBellProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (notificationsPath) {
      router.push(notificationsPath);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative group"
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
    >
      <div className="p-3 bg-soft-sage border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all transform hover:-translate-y-[2px] hover:-translate-x-[2px]">
        <Bell size={24} className="text-deep-moss" strokeWidth={3} />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-deep-moss text-soft-sage rounded-full flex items-center justify-center text-sm font-bold border-2 border-soft-sage">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};
