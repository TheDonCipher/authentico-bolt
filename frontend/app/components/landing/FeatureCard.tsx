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
    className={`${color} p-4 sm:p-6 md:p-8 flex flex-col items-center text-center border-4 sm:border-6 md:border-8 border-deep-moss transform hover:rotate-1 transition-all duration-300 rounded-lg shadow-brutal-sm sm:shadow-brutal`}
    whileHover={{ scale: 1.02, boxShadow: '6px 6px 0 0 rgba(27, 67, 50, 0.8)' }}
    transition={{ duration: 0.2 }}
  >
    <div className="text-ivory mb-4 sm:mb-6 bg-deep-moss p-3 sm:p-4 border-2 sm:border-4 border-ivory rounded-full">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-4 text-ivory">
      {title}
    </h3>
    <p className="font-bold text-sm sm:text-base text-ivory">{description}</p>
  </motion.div>
);
