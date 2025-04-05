import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield } from 'lucide-react';

export const WhoIsItForSection: React.FC = () => (
  <section className="mb-20 p-8">
    <h3 className="text-3xl font-black mb-8 text-center">Who Is It For?</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div
        className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
        whileHover={{ scale: 1.05 }}
      >
        <Users size={48} className="mb-4 text-[#4A6741]" />
        <h4 className="text-xl font-black mb-2">Individuals</h4>
        <p className="font-bold">
          Securely store and share your personal documents, from certificates to
          IDs.
        </p>
      </motion.div>
      <motion.div
        className="bg-[#E5DCC3] p-6 border-8 border-[#2C3E50] flex flex-col items-center text-center"
        whileHover={{ scale: 1.05 }}
      >
        <Shield size={48} className="mb-4 text-[#4A6741]" />
        <h4 className="text-xl font-black mb-2">Organizations</h4>
        <p className="font-bold">
          Streamline document verification processes and enhance security.
        </p>
      </motion.div>
    </div>
  </section>
);
