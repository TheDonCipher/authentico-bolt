import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  duration?: number; // Duration in milliseconds
  details?: string; // Optional details for expandable toasts
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onClose,
  duration = 5000,
  details,
}) => {
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

  // Define styles based on toast type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-soft-sage',
          iconColor: 'text-sap-green',
          borderColor: 'border-sap-green',
          icon: <CheckCircle className="flex-shrink-0" size={20} />,
          label: 'Success',
        };
      case 'warning':
        return {
          bgColor: 'bg-sunflower',
          iconColor: 'text-deep-moss',
          borderColor: 'border-deep-moss',
          icon: <AlertTriangle className="flex-shrink-0" size={20} />,
          label: 'Warning',
        };
      case 'info':
        return {
          bgColor: 'bg-sky-blue',
          iconColor: 'text-deep-moss',
          borderColor: 'border-deep-moss',
          icon: <Info className="flex-shrink-0" size={20} />,
          label: 'Info',
        };
      case 'error':
        return {
          bgColor: 'bg-burnt-sienna bg-opacity-80',
          iconColor: 'text-ivory',
          borderColor: 'border-deep-moss',
          icon: <AlertCircle className="flex-shrink-0" size={20} />,
          label: 'Error',
        };
      default:
        return {
          bgColor: 'bg-soft-sage',
          iconColor: 'text-deep-moss',
          borderColor: 'border-deep-moss',
          icon: <Info className="flex-shrink-0" size={20} />,
          label: 'Notice',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, y: 50, rotate: 2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-[100] max-w-md w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-auto"
    >
      <div
        className={`
        ${styles.bgColor}
        p-0 border-2 sm:border-4 ${styles.borderColor}
        shadow-brutal-sm sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]
        overflow-hidden
      `}
      >
        {/* Top label bar */}
        <div
          className={`${styles.iconColor} bg-deep-moss px-2 sm:px-3 py-1 flex items-center justify-between`}
        >
          <div className="flex items-center">
            <span className="font-bold text-ivory text-xs sm:text-sm">
              {styles.label}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 p-1 text-ivory hover:text-soft-sage transition-colors flex-shrink-0 touch-target"
              aria-label="Close notification"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Message content */}
        <div className="p-2 sm:p-3 flex items-start">
          <div className={`mr-2 sm:mr-3 ${styles.iconColor}`}>
            {React.cloneElement(styles.icon, {
              size: window.innerWidth < 640 ? 16 : 20,
            })}
          </div>
          <div className="flex-1">
            <p className="text-deep-moss text-sm sm:text-base font-medium line-clamp-3">
              {message}
            </p>
            {details && (
              <p className="text-deep-moss text-xs sm:text-sm mt-1 opacity-80">
                {details}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
