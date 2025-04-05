import React from 'react';
import { motion } from 'framer-motion';

export const Toast: React.FC<{
  type: 'success' | 'error';
  message: string;
}> = ({ type, message }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white p-4 rounded-lg shadow-lg z-50`}
  >
    {message}
  </motion.div>
);
