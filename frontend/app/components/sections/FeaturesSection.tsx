import React from 'react';
import { Upload, LayoutDashboard, Share2 } from 'lucide-react';
import { FeatureCard } from '../landing/FeatureCard';

export const FeaturesSection: React.FC = () => (
  <section id="features" className="mb-20 p-8">
    <h3 className="text-3xl font-black mb-8 text-center">Features</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <FeatureCard
        icon={<Upload size={48} />}
        title="Secure Upload and Verify"
        description="Secure uploads with AI screening and blockchain verification"
        color="bg-[#4A6741]"
      />
      <FeatureCard
        icon={<LayoutDashboard size={48} />}
        title="Intuitive Dashboard"
        description="Manage all your documents effortlessly"
        color="bg-[#5D8C5D]"
      />
      <FeatureCard
        icon={<Share2 size={48} />}
        title="Document Sharing"
        description="Easily share your verified documents securely"
        color="bg-[#5D8C5D]"
      />
    </div>
  </section>
);
