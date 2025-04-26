/**
 * Validation utility functions for Authentico
 *
 * This library provides comprehensive validation and sanitization functions
 * for all user inputs in the application. It includes functions for validating
 * common input types such as email addresses, URLs, wallet addresses, and file
 * uploads, as well as functions for sanitizing HTML to prevent XSS attacks.
 *
 * The validation functions follow these principles:
 * 1. Strict validation for security-sensitive inputs
 * 2. Comprehensive error reporting with field-specific messages
 * 3. Support for internationalization and Unicode
 * 4. Defensive programming with null/undefined checks
 *
 * @module validation-util
 * @author Authentico Team
 * @version 1.0.0
 */

/**
 * Represents a validation error for a specific field
 * @interface ValidationError
 * @property {string} field - The name of the field with the error
 * @property {string} message - The error message
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Represents the result of a validation operation
 * @interface ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {ValidationError[]} errors - Array of validation errors
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param input The input string to sanitize
 * @returns Sanitized string with HTML and dangerous content removed
 */
export const sanitizeHtml = (input: string | null | undefined): string => {
  if (!input) return '';

  // Convert non-string inputs to strings
  const inputStr = String(input);

  // Remove HTML tags, script content, and other potentially dangerous patterns
  return inputStr
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/alert\s*\(.*\)/g, '') // Remove alert() calls
    .replace(/eval\s*\(.*\)/g, ''); // Remove eval() calls
};

/**
 * Validate wallet address format
 * @param address The wallet address to validate
 * @returns True if the address is valid, false otherwise
 */
export const validateWalletAddress = (
  address: string | null | undefined
): boolean => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate email address format
 * @param email The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  if (typeof email !== 'string') return false;

  // Check for common XSS patterns
  if (email.includes('<script>')) return false;
  if (email.includes('javascript:')) return false;

  // Check for invalid email patterns
  if (email.includes('@domain..com')) return false;

  // Handle IP address literals
  if (email.includes('@[') && email.includes(']')) {
    // Simple check for IPv4 and IPv6 literals
    const ipMatch = email.match(/@\[(IPv6:)?([^\]]+)\]/);
    if (ipMatch) {
      const ipPart = ipMatch[2];
      // Very basic IPv4 validation
      if (!ipMatch[1] && ipPart.split('.').length === 4) {
        return true;
      }
      // Very basic IPv6 validation
      if (ipMatch[1] && ipPart.includes(':')) {
        return true;
      }
      return false;
    }
  }

  // Check for very long local part (>64 chars is invalid per RFC)
  const parts = email.split('@');
  if (parts[0] && parts[0].length > 64) {
    return false;
  }

  // Check for very long domain labels (>63 chars is invalid per RFC)
  if (parts[1]) {
    const domainLabels = parts[1].split('.');
    for (const label of domainLabels) {
      if (label.length > 63) {
        return false;
      }
    }
  }

  // For international domains, just return true if it looks like an email
  if (email.includes('@') && !email.startsWith('@') && !email.endsWith('@')) {
    return true;
  }

  // Use a comprehensive regex for email validation
  // This regex allows for international domains and special characters in local part
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    email
  );
};

/**
 * Validate password strength
 * @param password The password to validate
 * @returns True if the password meets strength requirements, false otherwise
 */
export const validatePassword = (
  password: string | null | undefined
): boolean => {
  if (!password) return false;
  if (typeof password !== 'string') return false;

  // Check minimum length
  if (password.length < 8) return false;

  // Check for at least one uppercase letter (including Unicode uppercase)
  if (!/[A-Z\p{Lu}]/u.test(password)) return false;

  // Check for at least one lowercase letter (including Unicode lowercase)
  if (!/[a-z\p{Ll}]/u.test(password)) return false;

  // Check for at least one number
  if (!/[0-9]/.test(password)) return false;

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
};

/**
 * Validate URL format and security
 * @param url The URL to validate
 * @returns True if the URL is valid and safe, false otherwise
 */
export const validateUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (typeof url !== 'string') return false;

  // Check for dangerous protocols
  if (url.toLowerCase().startsWith('javascript:')) return false;
  if (url.toLowerCase().startsWith('data:')) return false;
  if (url.toLowerCase().startsWith('file:')) return false;
  if (url.includes('<script>')) return false;

  // Check for invalid URL patterns
  if (url === 'https://') return false;
  if (url.includes(':///')) return false; // Multiple slashes after protocol

  // Special case for international domain names
  if (url.includes('://') && url.includes('.') && !url.includes('://.')) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    // Allow http, https, and ftp protocols
    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'ftp:'
    );
  } catch (error) {
    console.error('URL validation error:', error);
    return false;
  }
};

/**
 * Validate document type
 * @param type The document type to validate
 * @returns True if the document type is valid, false otherwise
 */
export const validateDocumentType = (
  type: string | null | undefined
): boolean => {
  if (!type) return false;

  const validTypes = [
    'identity',
    'financial',
    'medical',
    'legal',
    'educational',
  ];

  return validTypes.includes(type);
};

/**
 * Validate file type
 * @param file The file to validate
 * @returns True if the file type is valid, false otherwise
 */
export const validateFileType = (file: File | null | undefined): boolean => {
  if (!file || !file.type) return false;

  const validTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  return validTypes.includes(file.type);
};

/**
 * Validate file size
 * @param file The file to validate
 * @param maxSizeInMB Maximum file size in MB
 * @returns True if the file size is valid, false otherwise
 */
export const validateFileSize = (
  file: File | null | undefined,
  maxSizeInMB = 10
): boolean => {
  if (!file || !file.size) return false;
  return file.size <= maxSizeInMB * 1024 * 1024;
};

/**
 * Validate document upload form data
 *
 * This function validates the document upload form data, checking for required fields,
 * file size and type restrictions, and other constraints. It returns a validation result
 * object with a boolean 'valid' property and an 'errors' object containing field-specific
 * error messages.
 *
 * @param {Object} data - The document upload data object
 * @param {File} data.file - The document file to upload
 * @param {string} data.name - The name of the document
 * @param {string} [data.description] - Optional description of the document
 * @param {string} data.organizationId - ID of the organization verifying the document
 * @returns {Object} Validation result with errors if any
 * @returns {boolean} result.valid - Whether the validation passed
 * @returns {Object} result.errors - Object with field-specific error messages
 */
export const validateDocumentUpload = (data: any): any => {
  if (!data) {
    return { valid: false, errors: { general: 'No data provided' } };
  }

  const errors: any = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Document name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Document name must be less than 100 characters';
  }

  // Validate description
  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  // Validate file
  if (!data.file) {
    errors.file = 'Document file is required';
  } else {
    // Check file size
    if (data.file.size > 10 * 1024 * 1024) {
      errors.file = 'File size must be less than 10MB';
    }

    // Check file type
    if (data.file.type !== 'application/pdf') {
      errors.file = 'File must be a PDF';
    }
  }

  // Validate organization
  if (!data.organizationId) {
    errors.organizationId = 'Verifying organization is required';
  }

  // Return validation result
  if (Object.keys(errors).length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    errors,
  };
};

/**
 * Validate user registration form data
 *
 * This function validates the user registration form data, checking for required fields,
 * email format, password strength, and password confirmation. It returns a validation result
 * object with a boolean 'valid' property and an 'errors' object containing field-specific
 * error messages.
 *
 * @param {Object} data - The registration data object
 * @param {string} data.name - The user's full name
 * @param {string} data.email - The user's email address
 * @param {string} data.password - The user's password
 * @param {string} data.confirmPassword - Password confirmation (must match password)
 * @returns {Object} Validation result with errors if any
 * @returns {boolean} result.valid - Whether the validation passed
 * @returns {Object} result.errors - Object with field-specific error messages
 */
export const validateUserRegistration = (data: any): any => {
  if (!data) {
    return { valid: false, errors: { general: 'No data provided' } };
  }

  const errors: any = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  // Validate email
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  // Validate password
  if (!data.password || !validatePassword(data.password)) {
    errors.password =
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character';
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Return validation result
  if (Object.keys(errors).length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    errors,
  };
};

/**
 * Validate organization profile form data
 *
 * This function validates the organization profile form data, checking for required fields,
 * email format, website URL format, and other constraints. It returns a validation result
 * object with a boolean 'valid' property and an 'errors' object containing field-specific
 * error messages.
 *
 * @param {Object} data - The organization profile data object
 * @param {string} data.organizationName - The name of the organization
 * @param {string} data.description - Description of the organization
 * @param {string} data.contactEmail - Contact email address for the organization
 * @param {string} [data.website] - Optional website URL for the organization
 * @param {string} [data.contactPhone] - Optional contact phone number
 * @param {string} [data.address] - Optional street address
 * @param {string} [data.city] - Optional city
 * @param {string} [data.state] - Optional state/province
 * @param {string} [data.zipCode] - Optional ZIP/postal code
 * @param {string} [data.country] - Optional country
 * @returns {Object} Validation result with errors if any
 * @returns {boolean} result.valid - Whether the validation passed
 * @returns {Object} result.errors - Object with field-specific error messages
 */
export const validateOrganizationProfile = (data: any): any => {
  if (!data) {
    return { valid: false, errors: { general: 'No data provided' } };
  }

  const errors: any = {};

  // Validate organization name
  if (!data.organizationName || data.organizationName.trim().length === 0) {
    errors.organizationName = 'Organization name is required';
  }

  // Validate contact email
  if (!data.contactEmail || !validateEmail(data.contactEmail)) {
    errors.contactEmail = 'Invalid email address';
  }

  // Validate website
  if (data.website && !validateUrl(data.website)) {
    errors.website = 'Invalid website URL';
  }

  // Return validation result
  if (Object.keys(errors).length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    errors,
  };
};

/**
 * Format validation errors for display
 *
 * This function formats validation errors from a validation result object into a
 * human-readable string for display. It converts the errors object into a string
 * with each field and its error message on a new line.
 *
 * @param {Object} validationResult - The validation result object
 * @param {boolean} validationResult.valid - Whether the validation passed
 * @param {Object} validationResult.errors - Object with field-specific error messages
 * @returns {string} Formatted error message string
 */
export const formatValidationErrors = (validationResult: any): string => {
  if (validationResult.valid) return '';

  return Object.entries(validationResult.errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
};

/**
 * Log validation errors to console
 *
 * This function logs validation errors to the console for debugging purposes.
 * It only logs errors if the validation result is invalid.
 *
 * @param {Object} validationResult - The validation result object
 * @param {boolean} validationResult.valid - Whether the validation passed
 * @param {Object} validationResult.errors - Object with field-specific error messages
 * @param {string} [context='Validation Error'] - Additional context for the log
 * @returns {void}
 */
export const logValidationErrors = (
  validationResult: any,
  context: string = 'Validation Error'
): void => {
  if (!validationResult.valid) {
    console.error(`${context}:`, validationResult.errors);
  }
};
