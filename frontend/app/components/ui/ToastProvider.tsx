'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastProps } from './Toast';

// Define the context type
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

// Create the context with a default value
const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
  hideAllToasts: () => {},
});

// Define the toast item type with an ID
interface ToastItem extends ToastProps {
  id: string;
}

// Export the hook for using the toast context
export const useToast = () => useContext(ToastContext);

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Generate a unique ID for each toast
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Show a toast
  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = generateId();
    setToasts((prevToasts) => [...prevToasts, { ...toast, id, onClose: () => hideToast(id) }]);
  }, [generateId]);

  // Hide a specific toast
  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Hide all toasts
  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, hideAllToasts }}>
      {children}
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            details={toast.details}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
