import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC<{
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose?: () => void;
  duration?: number; // Duration in milliseconds
}> = ({ type, message, onClose, duration = 5000 }) => {
  // Auto-dismiss timer
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      // Clear the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 mx-4 md:mx-0 md:left-1/2 md:transform md:-translate-x-1/2
      ${
        type === 'success'
          ? 'bg-soft-sage'
          : type === 'warning'
          ? 'bg-sunflower-yellow bg-opacity-20'
          : 'bg-burnt-sienna bg-opacity-20'
      }
      text-deep-moss p-3 md:p-4 border-2 md:border-4 border-deep-moss font-bold
      shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]
      z-[100] max-w-md w-[calc(100%-2rem)] md:w-auto
      flex items-center justify-between text-sm md:text-base`}
    >
      <div className="flex items-center flex-1 mr-2">
        {type === 'success' ? (
          <CheckCircle
            className="mr-2 text-sap-green flex-shrink-0"
            size={16}
          />
        ) : type === 'warning' ? (
          <AlertTriangle
            className="mr-2 text-sunflower-yellow flex-shrink-0"
            size={16}
          />
        ) : (
          <AlertCircle
            className="mr-2 text-burnt-sienna flex-shrink-0"
            size={16}
          />
        )}
        <span className="line-clamp-3">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:text-forest-green transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};
