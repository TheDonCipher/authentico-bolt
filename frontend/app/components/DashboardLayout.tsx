'use client';

import React, { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  sidebar,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-ivory text-deep-moss">
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - hidden on mobile unless toggled */}
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-0 z-40' : 'hidden'
        } md:relative md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss md:h-screen overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        <div className="p-4">
          {/* Close button - only visible on mobile when sidebar is open */}
          <button
            onClick={toggleSidebar}
            className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
          {sidebar}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
          {header}
        </header>
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
