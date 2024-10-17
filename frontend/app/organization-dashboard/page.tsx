/* eslint-disable */
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Database, Key, FileText, Users, Settings } from 'lucide-react';

const OrganizationDashboard = () => {
  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 73 }}
          className="bg-[#5784c2] p-4 sticky top-0 z-20 border-b-8 border-[#2C3E50]"
        >
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-black text-white">Organization Dashboard</h1>
            <nav>
              <ul className="flex space-x-4 items-center">
                <li>
                  <Link href="/" className="hover:bg-[#5D8C5D] transition duration-300 p-2 border-4 border-white text-white font-bold">
                    Home
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-12">
          <h2 className="text-4xl font-black mb-8">Welcome to the Organization Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DashboardCard 
              icon={<FileText size={48} />}
              title="Documents"
              description="Manage and verify documents"
              link="/organization-dashboard/documents"
            />
            <DashboardCard 
              icon={<Users size={48} />}
              title="Users"
              description="Manage organization users"
              link="/organization-dashboard/users"
            />
            <DashboardCard 
              icon={<Settings size={48} />}
              title="Settings"
              description="Organization settings"
              link="/organization-dashboard/settings"
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#4A6741] text-white p-8 border-t-8 border-[#2C3E50]">
          <div className="container mx-auto text-center">
            <p>&copy; 2024 Authentico. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, link }) => (
  <motion.div 
    className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
    whileHover={{ scale: 1.05 }}
  >
    <div className="text-[#4A6741] mb-4">{icon}</div>
    <h3 className="text-xl font-black mb-2">{title}</h3>
    <p className="font-bold mb-4">{description}</p>
    <Link href={link} className="bg-[#4A6741] text-white text-xl font-bold py-2 px-4 border-4 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300">
      Go to {title}
    </Link>
  </motion.div>
);

export default OrganizationDashboard;