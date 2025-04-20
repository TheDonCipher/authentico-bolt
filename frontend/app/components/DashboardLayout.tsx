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

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-full bg-ivory text-deep-moss">
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all touch-target"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <aside
        className={`${
          sidebarOpen ? 'fixed right-0 top-0 bottom-0 w-[280px] z-40' : 'hidden'
        } md:relative md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss md:min-h-screen md:h-full overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        <div className="p-3 md:p-4 flex flex-col h-full">
          {/* Close button - only visible on mobile when sidebar is open */}
          <button
            onClick={toggleSidebar}
            className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green touch-target"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
          <div className="flex-1 overflow-y-auto">{sidebar}</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-soft-sage p-3 md:p-4 border-b-2 md:border-b-4 border-deep-moss sticky top-0 z-20">
          {header}
        </header>
        <main className="flex-1 p-3 md:p-4 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
