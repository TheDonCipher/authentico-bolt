'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DocumentProcessingAnimationProps {
  stage: 'encrypting' | 'uploading' | 'blockchain' | 'complete';
  progress?: number;
}

export const DocumentProcessingAnimation: React.FC<DocumentProcessingAnimationProps> = ({
  stage,
  progress = 0,
}) => {
  // Define animations and colors based on the current stage
  const getStageConfig = () => {
    switch (stage) {
      case 'encrypting':
        return {
          title: 'Encrypting Document',
          color: 'var(--forest-green)',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ivory"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
          description: 'Securing your document with AES-256 encryption...',
        };
      case 'uploading':
        return {
          title: 'Uploading to IPFS',
          color: 'var(--sap-green)',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ivory"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          ),
          description: 'Storing your encrypted document on decentralized storage...',
        };
      case 'blockchain':
        return {
          title: 'Anchoring on Blockchain',
          color: 'var(--deep-moss)',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ivory"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
          description: 'Creating an immutable record of your document on the blockchain...',
        };
      case 'complete':
        return {
          title: 'Document Processed',
          color: 'var(--sap-green)',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ivory"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
          description: 'Your document has been successfully processed and secured!',
        };
    }
  };

  const stageConfig = getStageConfig();

  return (
    <div className="flex flex-col items-center">
      {/* Document with animated elements */}
      <div className="relative w-32 h-40 mb-4">
        {/* Base document */}
        <motion.div
          className="absolute inset-0 bg-ivory border-4 border-deep-moss shadow-brutal"
          initial={{ rotate: -5 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Document content lines */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="w-full h-2 bg-soft-sage mb-2"></div>
          <div className="w-3/4 h-2 bg-soft-sage mb-2"></div>
          <div className="w-full h-2 bg-soft-sage mb-2"></div>
          <div className="w-1/2 h-2 bg-soft-sage"></div>
        </motion.div>

        {/* Processing indicator */}
        <motion.div
          className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: stageConfig.color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {stageConfig.icon}
        </motion.div>

        {/* Animated particles for the current stage */}
        {stage !== 'complete' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: stageConfig.color }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.random() * 60 - 30, 
                  y: Math.random() * 60 - 30, 
                  opacity: [0, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.3,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Stage title */}
      <h3 className="text-xl font-bold text-deep-moss mb-2">{stageConfig.title}</h3>

      {/* Progress bar */}
      {stage !== 'complete' && (
        <div className="w-full max-w-xs bg-soft-sage h-3 border-2 border-deep-moss mb-2 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ 
              backgroundColor: stageConfig.color,
              width: `${progress}%` 
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-deep-moss text-center">{stageConfig.description}</p>
    </div>
  );
};
