'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Icons } from '../../components/Icons';
import { SignOutButton } from '../../components/auth/SignOutButton';
import { Menu, X } from 'lucide-react';

export default function SidebarNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close menu when screen size becomes larger than small breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      path: '/organization-dashboard',
      label: 'Organization Dashboard',
      icon: <Icons.Dashboard />,
    },
    {
      path: '/verification-queue',
      label: 'Verification Queue',
      icon: <Icons.Queue />,
    },
    {
      path: '/document-history',
      label: 'Document History',
      icon: <Icons.History />,
    },
    {
      path: '/organization-settings',
      label: 'Settings',
      icon: <Icons.Settings />,
    },
  ];

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - desktop version is always visible, mobile version is conditional */}
      <div
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-40 block' : 'hidden'
        } md:relative md:block md:w-64 md:flex-none md:min-h-screen bg-soft-sage p-4 border-r-4 border-deep-moss font-['Inter'] overflow-y-auto transition-all duration-300 ease-in-out`}
      >
        {/* Close button - only visible on mobile */}
        {isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        )}

        <h1 className="inline-block font-black text-2xl md:text-3xl mb-6 md:mb-8 tracking-tight text-deep-moss bg-ivory px-3 py-1 md:px-4 md:py-2 border-2 border-deep-moss shadow-brutal hover:-translate-y-0.5 transition-transform">
          Authentico
        </h1>

        <nav className="flex flex-col gap-3 flex-grow">
          {navItems.map(({ path, label, icon }) => (
            <Link href={path} key={path}>
              <div
                className={`flex items-center gap-3 px-4 py-3 border-2 transition-all
                ${
                  isActive(path)
                    ? 'bg-forest-green text-ivory border-deep-moss shadow-brutal'
                    : 'border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5'
                }`}
              >
                <div
                  className={isActive(path) ? 'text-ivory' : 'text-deep-moss'}
                >
                  {icon}
                </div>
                <p
                  className={`font-bold text-base tracking-tight ${
                    isActive(path) ? 'text-ivory' : 'text-deep-moss'
                  }`}
                >
                  {label}
                </p>
              </div>
            </Link>
          ))}
        </nav>

        <div className="pt-6 pb-4">
          <SignOutButton className="flex items-center gap-3 px-4 py-3 bg-burnt-sienna bg-opacity-20 text-deep-moss border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all w-full" />
        </div>
      </div>
    </>
  );
}
