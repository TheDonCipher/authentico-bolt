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
      className="relative group touch-target"
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
    >
      <div className="p-2 sm:p-3 bg-soft-sage border-2 sm:border-4 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] sm:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all transform hover:-translate-y-[1px] hover:-translate-x-[1px] sm:hover:-translate-y-[2px] sm:hover:-translate-x-[2px]">
        <Bell
          size={20}
          className="text-deep-moss sm:w-6 sm:h-6"
          strokeWidth={3}
        />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-deep-moss text-soft-sage rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 border-soft-sage">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};
