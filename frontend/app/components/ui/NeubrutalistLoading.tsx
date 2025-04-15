import React from 'react';
import { motion } from 'framer-motion';

interface NeubrutalistLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const NeubrutalistLoading: React.FC<NeubrutalistLoadingProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-[#F0EAD6] bg-opacity-90 flex items-center justify-center z-[100]'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="bg-white border-4 border-[#556B2F] p-6 shadow-[8px_8px_0px_0px_rgba(85,107,47,1)] max-w-sm w-full text-center transform rotate-1">
        <h3 className="text-2xl font-black mb-4 text-[#2F4F4F] transform -rotate-2 inline-block bg-[#D2E3C8] p-2 border-4 border-[#556B2F]">
          {message}
        </h3>

        <div className="flex justify-center my-4">
          <div className="relative w-24 h-24">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute top-0 left-0 w-full h-full border-4 border-[#556B2F]"
                style={{
                  rotate: index * 15,
                  backgroundColor:
                    index === 0
                      ? '#D2E3C8'
                      : index === 1
                      ? '#E8EDE1'
                      : '#F0EAD6',
                }}
                animate={{
                  rotate: [index * 15, index * 15 + 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        <p className="text-[#2F4F4F] font-bold">Please wait a moment</p>
      </div>
    </div>
  );
};
