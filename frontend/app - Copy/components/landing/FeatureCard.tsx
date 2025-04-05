import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
}) => (
  <motion.div
    className={`${color} p-8 flex flex-col items-center text-center border-8 border-[#2C3E50] transform hover:rotate-2 transition-all duration-300 rounded-lg`}
    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
  >
    <div className="text-white mb-6 bg-[#2C3E50] p-4 border-4 border-white rounded-full">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 text-white">{title}</h3>
    <p className="font-bold text-white">{description}</p>
  </motion.div>
);
