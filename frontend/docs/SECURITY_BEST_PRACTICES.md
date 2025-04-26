# Authentico Security Best Practices

This document outlines security best practices specific to the Authentico platform.

## Blockchain Document Verification

### Document Hashing

When hashing documents for blockchain verification:

1. **Use Secure Hashing Algorithms**: Always use SHA-256 or stronger algorithms.
2. **Include Metadata**: Hash should include document metadata to prevent replay attacks.
3. **Verify Hash Integrity**: Always verify the hash before and after blockchain transactions.

```javascript
// Example of secure document hashing
async function hashDocument(file, metadata) {
  // Create a combined buffer of file and metadata
  const fileBuffer = await file.arrayBuffer();
  const metadataBuffer = Buffer.from(JSON.stringify(metadata));
  const combinedBuffer = Buffer.concat([
    Buffer.from(fileBuffer),
    metadataBuffer
  ]);
  
  // Create SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
```

### Blockchain Transactions

When submitting transactions to the blockchain:

1. **Validate Inputs**: Always validate all inputs before submitting transactions.
2. **Handle Errors**: Implement proper error handling for failed transactions.
3. **Verify Results**: Always verify transaction results after confirmation.

```javascript
// Example of secure blockchain transaction
async function storeDocumentHash(hash, metadata) {
  try {
    // Validate inputs
    if (!hash || hash.length !== 64) {
      throw new Error('Invalid document hash');
    }
    
    if (!metadata || !metadata.documentId) {
      throw new Error('Invalid document metadata');
    }
    
    // Submit transaction
    const tx = await documentContract.storeDocumentHash(
      hash,
      metadata.documentId,
      metadata.timestamp
    );
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    // Verify transaction success
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }
    
    // Verify emitted event
    const event = receipt.events.find(e => e.event === 'DocumentHashStored');
    if (!event) {
      throw new Error('DocumentHashStored event not emitted');
    }
    
    // Verify event data
    const [storedHash, storedDocumentId] = event.args;
    if (storedHash !== hash || storedDocumentId !== metadata.documentId) {
      throw new Error('Stored data does not match input data');
    }
    
    return receipt;
  } catch (error) {
    console.error('Failed to store document hash:', error);
    throw error;
  }
}
```

## IPFS Document Storage

### Document Encryption

Before uploading documents to IPFS:

1. **Encrypt Documents**: Always encrypt documents before uploading to IPFS.
2. **Secure Key Management**: Securely manage encryption keys.
3. **Metadata Separation**: Store sensitive metadata separately from the document.

```javascript
// Example of document encryption for IPFS
async function encryptDocumentForIPFS(file, encryptionKey) {
  // Generate a random IV
  const iv = crypto.randomBytes(16);
  
  // Convert file to buffer
  const fileBuffer = await file.arrayBuffer();
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  // Encrypt file
  const encryptedBuffer = Buffer.concat([
    cipher.update(Buffer.from(fileBuffer)),
    cipher.final()
  ]);
  
  // Combine IV and encrypted data
  const result = Buffer.concat([
    iv,
    encryptedBuffer
  ]);
  
  return result;
}
```

### IPFS Access Control

When using IPFS:

1. **Use Private IPFS Nodes**: Consider using private IPFS nodes for sensitive documents.
2. **Implement Access Control**: Use encryption and access control mechanisms.
3. **Monitor IPFS Content**: Regularly monitor IPFS content for unauthorized access.

```javascript
// Example of IPFS upload with access control
async function uploadToIPFSWithAccessControl(encryptedFile, accessControl) {
  try {
    // Upload encrypted file to IPFS
    const result = await ipfs.add(encryptedFile);
    const cid = result.cid.toString();
    
    // Store access control information
    await storeAccessControl(cid, accessControl);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload to IPFS:', error);
    throw error;
  }
}

async function storeAccessControl(cid, accessControl) {
  // Store access control information in database
  await db.collection('ipfs_access').doc(cid).set({
    allowedUsers: accessControl.allowedUsers,
    allowedOrganizations: accessControl.allowedOrganizations,
    createdBy: accessControl.createdBy,
    createdAt: new Date(),
    expiresAt: accessControl.expiresAt || null
  });
}
```

## Firebase Security

### Firestore Security Rules

Implement strict security rules for Firestore:

```javascript
// Example of Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOrganization() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organization';
    }
    
    function isDocumentOwner(docId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/documents/$(docId)).data.ownerId == request.auth.uid;
    }
    
    function isSharedWithUser(docId) {
      return isAuthenticated() && 
             request.auth.uid in get(/databases/$(database)/documents/documents/$(docId)).data.sharedWith;
    }
    
    // User rules
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Document rules
    match /documents/{docId} {
      allow read: if isAuthenticated() && (isDocumentOwner(docId) || isSharedWithUser(docId) || isAdmin() || (isOrganization() && resource.data.organizationId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (isDocumentOwner(docId) || isAdmin());
      allow delete: if isAuthenticated() && (isDocumentOwner(docId) || isAdmin());
    }
    
    // Organization rules
    match /organizations/{orgId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId || isAdmin());
      allow delete: if isAdmin();
    }
  }
}
```

### Firebase Authentication

When using Firebase Authentication:

1. **Custom Claims**: Use custom claims for role-based access control.
2. **Session Management**: Implement proper session management.
3. **Multi-Factor Authentication**: Consider implementing MFA for sensitive operations.

```javascript
// Example of setting custom claims
async function setUserRole(uid, role) {
  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Update user document
    await admin.firestore().collection('users').doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to set user role:', error);
    throw error;
  }
}
```

## API Security

### API Authentication

For API authentication:

1. **JWT Validation**: Always validate JWT tokens for API requests.
2. **Token Expiration**: Implement short expiration times for tokens.
3. **Token Refresh**: Implement secure token refresh mechanisms.

```javascript
// Example of JWT validation middleware
function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### API Rate Limiting

Implement rate limiting for all API endpoints:

```javascript
// Example of API rate limiting configuration
const rateLimitConfig = {
  // Authentication endpoints
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again later'
  },
  
  // Document upload endpoints
  '/api/documents/upload': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per window
    message: 'Too many document uploads, please try again later'
  },
  
  // Document verification endpoints
  '/api/documents/verify': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per window
    message: 'Too many verification attempts, please try again later'
  },
  
  // Default rate limit for all other endpoints
  'default': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later'
  }
};
```

## Frontend Security

### React Component Security

When developing React components:

1. **Prop Validation**: Always validate component props.
2. **Sanitize Inputs**: Always sanitize user inputs.
3. **Secure State Management**: Implement secure state management.

```javascript
// Example of secure React component
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { sanitizeHtml } from '../../utils/security';

function DocumentCard({ document, onView, onShare }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Sanitize document name
  const sanitizedName = sanitizeHtml(document.name);
  
  // Handle view document
  const handleView = () => {
    if (!document || !document.id) return;
    onView(document.id);
  };
  
  // Handle share document
  const handleShare = () => {
    if (!document || !document.id) return;
    onShare(document.id);
  };
  
  return (
    <div className="document-card">
      <h3>{sanitizedName}</h3>
      <p>Type: {document.type}</p>
      <p>Verified by: {document.organizationName}</p>
      
      <div className="document-actions">
        <button onClick={handleView}>View</button>
        <button onClick={handleShare}>Share</button>
      </div>
    </div>
  );
}

// Prop validation
DocumentCard.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    organizationName: PropTypes.string.isRequired
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired
};

export default DocumentCard;
```

### Next.js Security Headers

Implement security headers in Next.js:

```javascript
// Example of Next.js security headers configuration
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ];
  }
};
```

## Security Testing

### Component Security Testing

Test React components for security vulnerabilities:

```javascript
// Example of component security testing
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentCard from '../../components/DocumentCard';

describe('DocumentCard Security Tests', () => {
  test('should sanitize document name to prevent XSS', () => {
    // Create a document with potentially malicious name
    const document = {
      id: 'doc1',
      name: '<script>alert("XSS")</script>Passport',
      type: 'identity',
      organizationName: 'Test Organization'
    };
    
    // Render component
    render(
      <DocumentCard
        document={document}
        onView={jest.fn()}
        onShare={jest.fn()}
      />
    );
    
    // Verify document name is sanitized
    const nameElement = screen.getByText('Passport');
    expect(nameElement).toBeInTheDocument();
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });
  
  test('should validate document ID before calling handlers', () => {
    // Create a document with missing ID
    const document = {
      id: '',
      name: 'Passport',
      type: 'identity',
      organizationName: 'Test Organization'
    };
    
    // Create mock handlers
    const onView = jest.fn();
    const onShare = jest.fn();
    
    // Render component
    render(
      <DocumentCard
        document={document}
        onView={onView}
        onShare={onShare}
      />
    );
    
    // Click view button
    fireEvent.click(screen.getByText('View'));
    
    // Verify handler was not called
    expect(onView).not.toHaveBeenCalled();
    
    // Click share button
    fireEvent.click(screen.getByText('Share'));
    
    // Verify handler was not called
    expect(onShare).not.toHaveBeenCalled();
  });
});
```

### API Security Testing

Test API endpoints for security vulnerabilities:

```javascript
// Example of API security testing
describe('API Security Tests', () => {
  test('should require authentication for protected endpoints', async () => {
    // Test without authentication
    const response = await fetch('/api/documents');
    
    // Verify response
    expect(response.status).toBe(401);
    expect(await response.json()).toHaveProperty('error', 'Unauthorized');
  });
  
  test('should validate input data', async () => {
    // Test with invalid input
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing required fields
      })
    });
    
    // Verify response
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('errors');
  });
  
  test('should enforce rate limiting', async () => {
    // Make multiple requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: '0x1234567890123456789012345678901234567890'
          })
        })
      );
    }
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests);
    
    // Verify at least one response has rate limiting error
    const rateLimited = responses.some(response => response.status === 429);
    expect(rateLimited).toBe(true);
  });
});
```

## Incident Response

### Security Incident Handling

When handling security incidents:

1. **Immediate Response**: Take immediate action to contain the incident.
2. **Investigation**: Investigate the cause and impact of the incident.
3. **Remediation**: Implement fixes to address the vulnerability.
4. **Communication**: Communicate with affected users and stakeholders.
5. **Prevention**: Implement measures to prevent similar incidents.

```javascript
// Example of security incident logging
function logSecurityIncident(incident) {
  // Log incident details
  console.error({
    timestamp: new Date().toISOString(),
    type: incident.type,
    description: incident.description,
    affectedUsers: incident.affectedUsers,
    affectedResources: incident.affectedResources,
    severity: incident.severity,
    status: 'open'
  });
  
  // Notify security team
  notifySecurityTeam(incident);
  
  // Take immediate action based on incident type
  switch (incident.type) {
    case 'unauthorized_access':
      // Invalidate affected sessions
      invalidateAffectedSessions(incident.affectedUsers);
      break;
    case 'data_breach':
      // Lock affected resources
      lockAffectedResources(incident.affectedResources);
      break;
    case 'suspicious_activity':
      // Monitor affected users
      monitorAffectedUsers(incident.affectedUsers);
      break;
    default:
      // Default action
      break;
  }
}
```

## Regular Security Reviews

Conduct regular security reviews:

1. **Code Reviews**: Conduct security-focused code reviews.
2. **Dependency Audits**: Regularly audit dependencies for vulnerabilities.
3. **Penetration Testing**: Conduct regular penetration testing.
4. **Security Training**: Provide security training for developers.

```bash
# Example of dependency audit
npm audit

# Example of security testing
npm run test:security:core

# Example of linting with security rules
npx eslint --plugin security --ext .js,.jsx,.ts,.tsx .
```
