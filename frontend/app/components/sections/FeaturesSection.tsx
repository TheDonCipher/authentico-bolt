import React from 'react';
import { Upload, LayoutDashboard, Share2 } from 'lucide-react';
import { FeatureCard } from '../landing/FeatureCard';

export const FeaturesSection: React.FC = () => (
  <section
    id="features"
    className="mb-8 xs:mb-12 sm:mb-16 md:mb-20 p-3 xs:p-4 sm:p-6 md:p-8"
  >
    <h3 className="text-xl xs:text-2xl sm:text-3xl font-black mb-4 xs:mb-6 sm:mb-8 text-center text-deep-moss">
      Features
    </h3>
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
      <FeatureCard
        icon={
          <Upload
            size={24}
            className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          />
        }
        title="Secure Upload and Verify"
        description="Secure uploads with AI screening and blockchain verification"
        color="bg-forest-green"
      />
      <FeatureCard
        icon={
          <LayoutDashboard
            size={24}
            className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          />
        }
        title="Intuitive Dashboard"
        description="Manage all your documents effortlessly"
        color="bg-deep-moss"
      />
      <FeatureCard
        icon={
          <Share2
            size={24}
            className="xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          />
        }
        title="Document Sharing"
        description="Easily share your verified documents securely"
        color="bg-deep-moss"
      />
    </div>
  </section>
);
