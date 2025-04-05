import React from 'react';
import { ProcessStep } from '../landing/ProcessStep';

export const HowItWorksSection: React.FC = () => (
  <section id="guide" className="mb-20 p-8">
    <h3 className="text-3xl font-black mb-8 text-center">How It Works</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
