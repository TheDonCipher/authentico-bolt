import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const Toast: React.FC<{
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-4 left-1/2 transform -translate-x-1/2
      ${type === 'success' ? 'bg-[#D2E3C8]' : 'bg-[#E6B8AF]'}
      text-[#2F4F4F] p-4 border-4 border-[#556B2F] font-bold
      shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] z-[100] max-w-md w-full md:w-auto
      flex items-center justify-between`}
  >
    <div className="flex items-center">
      {type === 'success' ? (
        <CheckCircle className="mr-2 text-[#4A6741]" size={20} />
      ) : (
        <AlertCircle className="mr-2 text-[#B22222]" size={20} />
      )}
      <span>{message}</span>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 hover:text-[#556B2F] transition-colors"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    )}
  </motion.div>
);
