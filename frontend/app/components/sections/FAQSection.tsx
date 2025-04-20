import React from 'react';
import { FAQItem } from '../landing/FAQItem';

export const FAQSection: React.FC = () => (
  <section id="faq" className="mb-12 sm:mb-16 md:mb-20 p-4 sm:p-6 md:p-8">
    <h3 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center text-deep-moss">
      Frequently Asked Questions
    </h3>
    <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
      <FAQItem
        question="How secure is Authentico?"
        answer="Authentico uses advanced blockchain technology to ensure the highest level of security for your documents."
      />
      <FAQItem
        question="What types of documents can I verify?"
        answer="You can verify a wide range of documents, including educational certificates, IDs, and official records."
      />
      <FAQItem
        question="How long does the verification process take?"
        answer="The verification process is typically completed within 24-48 hours, depending on the complexity of the document."
      />
    </div>
  </section>
);
