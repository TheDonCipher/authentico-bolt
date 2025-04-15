import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC<{
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-4 left-1/2 transform -translate-x-1/2
      ${
        type === 'success'
          ? 'bg-soft-sage'
          : type === 'warning'
          ? 'bg-sunflower-yellow bg-opacity-20'
          : 'bg-burnt-sienna bg-opacity-20'
      }
      text-deep-moss p-4 border-4 border-deep-moss font-bold
      shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] z-[100] max-w-md w-full md:w-auto
      flex items-center justify-between`}
  >
    <div className="flex items-center">
      {type === 'success' ? (
        <CheckCircle className="mr-2 text-sap-green" size={20} />
      ) : type === 'warning' ? (
        <AlertTriangle className="mr-2 text-sunflower-yellow" size={20} />
      ) : (
        <AlertCircle className="mr-2 text-burnt-sienna" size={20} />
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
