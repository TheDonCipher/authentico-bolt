'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../../components/Icons';
import { SignOutButton } from '../../components/auth/SignOutButton';

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
    <div className="w-64 flex-none min-h-screen flex flex-col bg-soft-sage p-4 border-r-4 border-deep-moss font-['Inter']">
      <h1 className="inline-block font-black text-3xl mb-8 tracking-tight text-deep-moss bg-ivory px-4 py-2 border-2 border-deep-moss shadow-brutal hover:-translate-y-0.5 transition-transform">
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
              <div className={isActive(path) ? 'text-ivory' : 'text-deep-moss'}>
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
        <SignOutButton className="flex items-center gap-3 px-4 py-3 bg-deep-moss text-ivory border-2 border-deep-moss shadow-brutal hover:-translate-y-0.5 transition-all w-full" />
      </div>
    </div>
  );
}
