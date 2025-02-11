'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../../components/Icons';

export default function SidebarNavigation() {
  const pathname = usePathname();

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
    { path: '/settings', label: 'Settings', icon: <Icons.Settings /> },
    { path: '/api-keys', label: 'API Keys', icon: <Icons.ApiKey /> },
    {
      path: '/usage-billing',
      label: 'Usage & Billing',
      icon: <Icons.Billing />,
    },
    { path: '/support', label: 'Support', icon: <Icons.Support /> },
  ];

  return (
    <div className="w-64 flex-none min-h-screen flex flex-col bg-[#F5F1E8] p-4 border-r-4 border-black font-['Inter']">
      <h1 className="inline-block font-black text-3xl mb-8 tracking-tight text-[#2A2A2A] bg-[#E8DFD8] px-4 py-2 border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-transform">
        Authentico
      </h1>

      <nav className="flex flex-col gap-3 flex-grow">
        {navItems.map(({ path, label, icon }) => (
          <Link href={path} key={path}>
            <div
              className={`flex items-center gap-3 px-4 py-3 border-2 transition-all
              ${
                isActive(path)
                  ? 'bg-[#8B786D] text-white border-black shadow-brutal'
                  : 'border-transparent hover:bg-[#E8DFD8] hover:border-black hover:shadow-brutal hover:-translate-y-0.5'
              }`}
            >
              <div className={isActive(path) ? 'text-white' : 'text-[#2A2A2A]'}>
                {icon}
              </div>
              <p
                className={`font-bold text-base tracking-tight ${
                  isActive(path) ? 'text-white' : 'text-[#2A2A2A]'
                }`}
              >
                {label}
              </p>
            </div>
          </Link>
        ))}
      </nav>

      <div className="pt-6 pb-4">
        <Link href="/signout">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2A2A2A] text-white border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all">
            <Icons.SignOut />
            <p className="font-bold text-base tracking-tight">Sign Out</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
