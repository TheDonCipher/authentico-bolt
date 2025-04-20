import React from 'react';
import { Upload, LayoutDashboard, Share2 } from 'lucide-react';
import { FeatureCard } from '../landing/FeatureCard';

export const FeaturesSection: React.FC = () => (
  <section id="features" className="mb-12 sm:mb-16 md:mb-20 p-4 sm:p-6 md:p-8">
    <h3 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center text-deep-moss">
      Features
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      <FeatureCard
        icon={<Upload size={36} className="sm:w-12 sm:h-12" />}
        title="Secure Upload and Verify"
        description="Secure uploads with AI screening and blockchain verification"
        color="bg-forest-green"
      />
      <FeatureCard
        icon={<LayoutDashboard size={36} className="sm:w-12 sm:h-12" />}
        title="Intuitive Dashboard"
        description="Manage all your documents effortlessly"
        color="bg-deep-moss"
      />
      <FeatureCard
        icon={<Share2 size={36} className="sm:w-12 sm:h-12" />}
        title="Document Sharing"
        description="Easily share your verified documents securely"
        color="bg-deep-moss"
      />
    </div>
  </section>
);
