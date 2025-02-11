import { SearchIcon } from 'lucide-react';

export const SearchBar = () => {
  return (
    <div className="flex items-center gap-2 md:gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <input
          className="w-full h-10 md:h-12 pl-3 md:pl-4 pr-10 md:pr-12 bg-white border-2 md:border-4 border-[#556B2F] focus:outline-none focus:ring-2 md:focus:ring-4 ring-[#D2E3C8] text-sm md:text-base font-bold placeholder:text-gray-500"
          placeholder="Search documents..."
        />
        <button className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
          <SearchIcon
            size={18}
            className="text-gray-500 hover:text-[#2F4F4F] transition-colors"
          />
        </button>
      </div>
    </div>
  );
};
