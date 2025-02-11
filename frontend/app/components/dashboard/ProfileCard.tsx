export const ProfileCard = () => {
  return (
    <div className="flex items-center gap-3 p-2 bg-white border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all">
      <div className="w-12 h-12 bg-[#D2E3C8] border-4 border-[#556B2F] rounded-full flex items-center justify-center">
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
          className="text-[#2F4F4F]"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex flex-col pr-2">
        <span className="font-bold text-[#2F4F4F]">
          {typeof window !== 'undefined'
            ? localStorage.getItem('name')
            : 'User'}
        </span>
        <span className="text-xs text-gray-600">Individual Account</span>
      </div>
    </div>
  );
};
