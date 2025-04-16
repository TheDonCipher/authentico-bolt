/**
 * Document Types
 * 
 * This file defines the common document types used in the application.
 * These types are used for document upload and filtering.
 */

export interface DocumentType {
  id: string;
  name: string;
  description: string;
}

/**
 * Common official document types
 */
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'identity',
    name: 'Identity Document',
    description: 'Government-issued identity documents like passport, driver\'s license, or national ID card'
  },
  {
    id: 'education',
    name: 'Educational Certificate',
    description: 'Diplomas, degrees, transcripts, or other educational qualifications'
  },
  {
    id: 'employment',
    name: 'Employment Document',
    description: 'Employment contracts, offer letters, or work certificates'
  },
  {
    id: 'financial',
    name: 'Financial Document',
    description: 'Bank statements, tax returns, or financial certificates'
  },
  {
    id: 'medical',
    name: 'Medical Record',
    description: 'Medical certificates, vaccination records, or health documents'
  },
  {
    id: 'property',
    name: 'Property Document',
    description: 'Property deeds, lease agreements, or ownership certificates'
  },
  {
    id: 'legal',
    name: 'Legal Document',
    description: 'Contracts, agreements, or legal certificates'
  },
  {
    id: 'certificate',
    name: 'Professional Certificate',
    description: 'Professional qualifications, licenses, or certifications'
  },
  {
    id: 'other',
    name: 'Other Document',
    description: 'Any other document type not listed above'
  }
];

/**
 * Get a document type by ID
 * @param id The document type ID
 * @returns The document type or undefined if not found
 */
export const getDocumentTypeById = (id: string): DocumentType | undefined => {
  return DOCUMENT_TYPES.find(type => type.id === id);
};

/**
 * Get a document type name by ID
 * @param id The document type ID
 * @returns The document type name or 'Unknown Document' if not found
 */
export const getDocumentTypeName = (id: string): string => {
  const docType = getDocumentTypeById(id);
  return docType ? docType.name : 'Unknown Document';
};

export default DOCUMENT_TYPES;
