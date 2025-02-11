'use client';

import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ header, sidebar, children }) => {
  return (
    <div className="flex h-screen bg-[#F0EAD6] text-[#2C3E50]">
      <aside className="w-64 bg-[#E5DCC3] border-r border-[#2C3E50]">
        {sidebar}
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#5784c2] p-4 border-b border-[#2C3E50]">
          {header}
        </header>
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;