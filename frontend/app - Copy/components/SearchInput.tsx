'use client';

import React from 'react';

const SearchInput = () => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input value:', event.target.value);
  };

  return (
    <div className="px-4 py-3">
      <label className="flex flex-col">
        <div className="flex items-stretch rounded-xl h-12 bg-gray-200">
          <div className="flex items-center justify-center pl-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </div>
          <input
            placeholder="Search for a document"
            onChange={handleSearchChange}
            className="form-input flex-1 rounded-xl text-gray-900 focus:outline-0 bg-gray-50 px-4 text-base"
          />
        </div>
      </label>
    </div>
  );
};

export default SearchInput;
