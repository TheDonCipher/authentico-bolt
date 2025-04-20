import React from 'react';
import { ProcessStep } from '../landing/ProcessStep';

export const HowItWorksSection: React.FC = () => (
  <section id="guide" className="mb-12 sm:mb-16 md:mb-20 p-4 sm:p-6 md:p-8">
    <h3 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center text-deep-moss">
      How It Works
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      <ProcessStep
        number={1}
        title="Upload"
        description="Upload any official documents to our platform"
      />
      <ProcessStep
        number={2}
        title="Verify"
        description="Document Issuers verify the authenticity of your documents"
      />
      <ProcessStep
        number={3}
        title="Access"
        description="Access and Share your verified documents anytime, anywhere"
      />
    </div>
  </section>
);
