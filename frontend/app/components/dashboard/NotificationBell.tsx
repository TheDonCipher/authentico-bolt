interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export const NotificationBell = ({ count, onClick }: NotificationBellProps) => {
  return (
    <button onClick={onClick} className="relative group">
      <div className="p-3 bg-soft-sage border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all transform hover:-translate-y-[2px] hover:-translate-x-[2px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-deep-moss"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-deep-moss text-soft-sage rounded-full flex items-center justify-center text-sm font-bold border-2 border-soft-sage">
            {count}
          </span>
        )}
      </div>
    </button>
  );
};
