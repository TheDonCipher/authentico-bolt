# Authentico Security Guide

This document provides security guidelines and best practices for developers working on the Authentico platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Data Protection](#data-protection)
4. [Input Validation](#input-validation)
5. [Session Management](#session-management)
6. [Rate Limiting](#rate-limiting)
7. [CSRF Protection](#csrf-protection)
8. [XSS Prevention](#xss-prevention)
9. [Secure Storage](#secure-storage)
10. [Blockchain Security](#blockchain-security)
11. [Security Testing](#security-testing)
12. [Incident Response](#incident-response)

## Authentication

### Wallet Authentication

Authentico uses wallet-based authentication with the following security measures:

- **Address Validation**: Always validate wallet addresses using the format `0x[a-fA-F0-9]{40}`.
- **Network Verification**: Verify the user is connected to the correct network (Sepolia testnet).
- **Signature Verification**: Use personal_sign for authentication challenges.
- **Token Management**: Securely manage JWT tokens with appropriate expiration.

```javascript
// Example of proper wallet address validation
function validateWalletAddress(address) {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
```

### Firebase Integration

When using Firebase authentication:

- Use custom tokens with limited lifetimes.
- Implement proper error handling for authentication failures.
- Never expose Firebase API keys in client-side code.
- Use Firebase Security Rules to restrict access to data.

## Authorization

### Role-Based Access Control

Authentico implements role-based access control (RBAC) with the following roles:

- **Admin**: Full access to all platform features.
- **Organization**: Access to organization dashboard and document verification.
- **Individual**: Access to individual dashboard and document management.

Always check user roles before allowing access to protected resources:

```javascript
// Example of proper role-based authorization
function canAccessResource(user, resource) {
  if (!user) return false;
  
  if (user.role === 'admin') return true;
  
  if (user.role === 'organization' && resource.type === 'organization') {
    return user.organizationId === resource.id;
  }
  
  if (user.role === 'individual' && resource.type === 'document') {
    return resource.ownerId === user.id || resource.sharedWith.includes(user.id);
  }
  
  return false;
}
```

### Route Protection

Protect routes based on user roles:

```javascript
// Example of route protection in Next.js
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  if (session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session },
  };
}
```

## Data Protection

### Encryption

- Use AES-256 encryption for sensitive data.
- Ensure the MASTER_KEY_SECRET is 32 characters long and securely stored.
- Never hardcode encryption keys in the source code.

```javascript
// Example of proper encryption
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text, key) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Data Minimization

- Only collect and store necessary data.
- Implement proper data retention policies.
- Provide users with the ability to delete their data.

## Input Validation

### Client-Side Validation

Always implement client-side validation for immediate feedback, but never rely on it for security:

```javascript
// Example of client-side validation
function validateDocumentUpload(formData) {
  const errors = {};
  
  if (!formData.documentName) {
    errors.documentName = 'Document name is required';
  }
  
  if (!formData.documentType) {
    errors.documentType = 'Document type is required';
  }
  
  if (!formData.organizationId) {
    errors.organizationId = 'Verifying organization is required';
  }
  
  if (!formData.document_file) {
    errors.document_file = 'Document file is required';
  } else {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(formData.document_file.type)) {
      errors.document_file = 'Invalid file type. Only PDF, JPEG, and PNG are allowed';
    }
    
    // Validate file size (10MB limit)
    if (formData.document_file.size > 10 * 1024 * 1024) {
      errors.document_file = 'File size exceeds the 10MB limit';
    }
  }
  
  return errors;
}
```

### Server-Side Validation

Always implement server-side validation for all inputs:

```javascript
// Example of server-side validation
function validateDocumentUpload(req) {
  const errors = {};
  
  // Validate document name
  if (!req.body.documentName) {
    errors.documentName = 'Document name is required';
  } else if (req.body.documentName.length > 100) {
    errors.documentName = 'Document name is too long (max 100 characters)';
  }
  
  // Validate document type
  const validTypes = ['identity', 'financial', 'medical', 'legal', 'educational'];
  if (!req.body.documentType) {
    errors.documentType = 'Document type is required';
  } else if (!validTypes.includes(req.body.documentType)) {
    errors.documentType = 'Invalid document type';
  }
  
  // Validate organization ID
  if (!req.body.organizationId) {
    errors.organizationId = 'Verifying organization is required';
  }
  
  // Validate file
  if (!req.files || !req.files.document_file) {
    errors.document_file = 'Document file is required';
  } else {
    // Validate file type
    const file = req.files.document_file;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.document_file = 'Invalid file type. Only PDF, JPEG, and PNG are allowed';
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      errors.document_file = 'File size exceeds the 10MB limit';
    }
  }
  
  return errors;
}
```

### Sanitization

Always sanitize user inputs to prevent XSS and injection attacks:

```javascript
// Example of input sanitization
function sanitizeHtml(input) {
  if (!input) return '';
  return input.replace(/<[^>]*>?/gm, '');
}
```

## Session Management

### Session Security

- Use secure, HttpOnly, and SameSite cookies for session management.
- Implement proper session expiration and renewal.
- Limit the number of active sessions per user.
- Provide the ability to invalidate all sessions on password change or security breach.

```javascript
// Example of secure cookie settings
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600000, // 1 hour
  path: '/'
};
```

### Session Monitoring

- Log session creation, renewal, and termination.
- Monitor for suspicious session activity.
- Implement automatic session termination for suspicious activity.

## Rate Limiting

### API Rate Limiting

Implement rate limiting for all API endpoints, especially for authentication and sensitive operations:

```javascript
// Example of rate limiting middleware
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginController);
```

### Progressive Delays

Implement progressive delays for repeated failed authentication attempts:

```javascript
// Example of progressive delay
function getLoginDelay(failedAttempts) {
  return Math.min(10000, Math.pow(2, failedAttempts) * 1000);
}
```

## CSRF Protection

### Token-Based Protection

Implement CSRF token validation for all state-changing operations:

```javascript
// Example of CSRF token generation
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Example of CSRF middleware
function csrfProtection(req, res, next) {
  const token = req.headers['x-csrf-token'];
  const storedToken = req.session.csrfToken;
  
  if (!token || !storedToken || token !== storedToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  
  next();
}
```

### SameSite Cookies

Use SameSite=Strict for all cookies to prevent CSRF attacks:

```javascript
// Example of SameSite cookie
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});
```

## XSS Prevention

### Content Security Policy

Implement a strict Content Security Policy (CSP) to prevent XSS attacks:

```javascript
// Example of CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
  );
  next();
});
```

### Output Encoding

Always encode output when displaying user-generated content:

```javascript
// Example of output encoding
function encodeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

## Secure Storage

### Sensitive Data Storage

- Never store sensitive data in localStorage or sessionStorage.
- Use secure cookies for authentication tokens.
- Encrypt sensitive data before storing it.

```javascript
// Example of secure storage utility
const secureStorage = {
  setItem: (key, value) => {
    const encrypted = encrypt(JSON.stringify(value), ENCRYPTION_KEY);
    localStorage.setItem(key, encrypted);
  },
  
  getItem: (key) => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = decrypt(encrypted, ENCRYPTION_KEY);
      return JSON.parse(decrypted);
    } catch (error) {
      return null;
    }
  },
  
  removeItem: (key) => {
    localStorage.removeItem(key);
  }
};
```

### Environment Variables

- Use environment variables for sensitive configuration.
- Never commit .env files to version control.
- Use different environment variables for development, testing, and production.

## Blockchain Security

### Smart Contract Interaction

- Always validate transaction parameters before sending.
- Implement proper error handling for blockchain interactions.
- Use appropriate gas limits and prices.

```javascript
// Example of secure contract interaction
async function secureContractCall(contract, method, params, options = {}) {
  try {
    // Validate parameters
    if (!contract || !method) {
      throw new Error('Invalid contract or method');
    }
    
    // Estimate gas to avoid out-of-gas errors
    const gasEstimate = await contract.estimateGas[method](...params);
    
    // Add 10% buffer to gas estimate
    const gasLimit = Math.floor(gasEstimate * 1.1);
    
    // Execute transaction with gas limit
    const tx = await contract[method](...params, {
      ...options,
      gasLimit
    });
    
    return tx;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  }
}
```

### Wallet Security

- Never store private keys in client-side code.
- Use secure wallet connection methods.
- Implement proper error handling for wallet interactions.

## Security Testing

### Automated Testing

Run security tests as part of your CI/CD pipeline:

```bash
# Run security tests
npm run test:security:core
```

### Manual Testing

Regularly perform manual security testing:

- Test authentication and authorization flows.
- Test input validation and sanitization.
- Test error handling and logging.
- Test rate limiting and CSRF protection.

## Incident Response

### Logging

Implement comprehensive logging for security events:

```javascript
// Example of security event logging
function logSecurityEvent(event, details) {
  console.log({
    timestamp: new Date().toISOString(),
    event,
    details,
    // Add additional context as needed
  });
}
```

### Response Plan

Develop an incident response plan:

1. **Identification**: Detect and confirm security incidents.
2. **Containment**: Limit the damage of the incident.
3. **Eradication**: Remove the cause of the incident.
4. **Recovery**: Restore affected systems and data.
5. **Lessons Learned**: Document the incident and improve security measures.

## Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Web3 Security Guidelines](https://consensys.github.io/smart-contract-best-practices/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
