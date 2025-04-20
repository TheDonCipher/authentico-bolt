import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield } from 'lucide-react';

export const WhoIsItForSection: React.FC = () => (
  <section className="mb-12 sm:mb-16 md:mb-20 p-4 sm:p-6 md:p-8">
    <h3 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center text-deep-moss">
      Who Is It For?
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
      <motion.div
        className="bg-soft-sage p-4 sm:p-6 border-4 sm:border-6 md:border-8 border-deep-moss flex flex-col items-center text-center shadow-brutal-sm sm:shadow-brutal rounded-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Users
          size={36}
          className="mb-3 sm:mb-4 text-forest-green sm:w-12 sm:h-12"
        />
        <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 text-deep-moss">
          Individuals
        </h4>
        <p className="font-bold text-sm sm:text-base text-deep-moss">
          Securely store and share your personal documents, from certificates to
          IDs.
        </p>
      </motion.div>
      <motion.div
        className="bg-soft-sage p-4 sm:p-6 border-4 sm:border-6 md:border-8 border-deep-moss flex flex-col items-center text-center shadow-brutal-sm sm:shadow-brutal rounded-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Shield
          size={36}
          className="mb-3 sm:mb-4 text-forest-green sm:w-12 sm:h-12"
        />
        <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 text-deep-moss">
          Organizations
        </h4>
        <p className="font-bold text-sm sm:text-base text-deep-moss">
          Streamline document verification processes and enhance security.
        </p>
      </motion.div>
    </div>
  </section>
);
