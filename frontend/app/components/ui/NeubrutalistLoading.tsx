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
    ? 'fixed inset-0 bg-ivory bg-opacity-90 flex items-center justify-center z-[100]'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="bg-ivory border-4 border-deep-moss p-6 shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] max-w-sm w-full text-center">
        <h3 className="text-2xl font-black mb-4 text-deep-moss inline-block bg-soft-sage p-2 border-4 border-deep-moss">
          {message}
        </h3>

        <div className="flex justify-center my-4">
          <div className="relative w-24 h-24">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="absolute top-0 left-0 w-full h-full border-4 border-deep-moss"
                style={{
                  rotate: index * 15,
                  backgroundColor:
                    index === 0
                      ? 'var(--soft-sage)'
                      : index === 1
                      ? 'var(--ivory)'
                      : 'var(--stone-gray)',
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

        <p className="text-deep-moss font-bold">
          Securely processing your request
        </p>
      </div>
    </div>
  );
};
