import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
}

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center`}
    >
      <span className="mr-2">{message}</span>
      <button className="ml-auto">
        <X size={18} />
      </button>
    </motion.div>
  );
};

export default Toast;