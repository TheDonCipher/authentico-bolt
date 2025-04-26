// Firestore collection names
export const USER_COLLECTION = 'users';
export const DOCUMENT_COLLECTION = 'documents';
export const ORGANIZATION_COLLECTION = 'organizations';
export const NOTIFICATION_COLLECTION = 'notifications';
export const VERIFICATION_COLLECTION = 'verifications';

// User types
export const USER_TYPE = {
  INDIVIDUAL: 'individual',
  ORGANIZATION: 'organization',
  ADMIN: 'admin',
};

// Document status
export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  // Numeric codes for backward compatibility
  PENDING_CODE: '0',
  VERIFIED_CODE: '1',
  REJECTED_CODE: '2',
};

// Organization status
export const ORGANIZATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    VALIDATE: '/api/auth/validate',
    SET_COOKIES: '/api/auth/set-cookies',
    CLEAR_COOKIES: '/api/auth/clear-cookies',
    CSRF_TOKEN: '/api/auth/csrf-token',
  },
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents/upload',
    VERIFY: '/api/documents/verify',
    SHARE: '/api/documents/share',
  },
  ORGANIZATIONS: {
    BASE: '/api/organizations',
    APPLICATIONS: '/api/organizations/applications',
    VERIFY: '/api/organizations/verify',
  },
  ADMIN: {
    STATS: '/api/admin/stats',
    AUDIT_LOGS: '/api/admin/audit-logs',
    USERS: '/api/admin/users',
    ORGANIZATIONS: '/api/admin/organizations',
    VERIFIED_ORGANIZATIONS: '/api/admin/verified-organizations',
  },
};
