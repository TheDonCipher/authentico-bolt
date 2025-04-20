import React from 'react';
import { motion } from 'framer-motion';

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({
  number,
  title,
  description,
}) => (
  <motion.div
    className="bg-soft-sage p-4 sm:p-6 border-4 sm:border-6 md:border-8 border-deep-moss flex flex-col items-center text-center shadow-brutal-sm sm:shadow-brutal"
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
  >
    <div className="bg-forest-green text-ivory text-xl sm:text-2xl font-bold w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4">
      {number}
    </div>
    <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 text-deep-moss">
      {title}
    </h4>
    <p className="font-bold text-sm sm:text-base text-deep-moss">
      {description}
    </p>
  </motion.div>
);
