import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-2 sm:border-4 border-deep-moss bg-soft-sage shadow-brutal-sm sm:shadow-brutal rounded-sm"
      initial={false}
      animate={{ backgroundColor: isOpen ? '#F0EAD6' : 'var(--soft-sage)' }}
    >
      <button
        className="w-full text-left p-3 sm:p-4 font-bold flex justify-between items-center text-deep-moss text-sm sm:text-base touch-target"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {question}
        <ChevronDown
          size={16}
          className={`transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          } ml-2 flex-shrink-0`}
        />
      </button>
      <motion.div
        initial="collapsed"
        animate={isOpen ? 'open' : 'collapsed'}
        variants={{
          open: { opacity: 1, height: 'auto' },
          collapsed: { opacity: 0, height: 0 },
        }}
        transition={{ duration: 0.3 }}
        className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-hidden"
      >
        <p className="text-sm sm:text-base text-deep-moss">{answer}</p>
      </motion.div>
    </motion.div>
  );
};
