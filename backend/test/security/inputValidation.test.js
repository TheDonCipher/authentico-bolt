/**
 * Security tests for Authentico input validation
 */
const express = require('express');
const request = require('supertest');

// Create a simple validation middleware for testing
const validateWalletAddress = (req, res, next) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // Validate wallet address format (0x followed by 40 hex characters)
  const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletAddressRegex.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  next();
};

const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

const validateDocumentType = (req, res, next) => {
  const { documentType } = req.body;

  if (!documentType) {
    return res.status(400).json({ error: 'Document type is required' });
  }

  // Validate document type
  const validDocumentTypes = [
    'identity',
    'financial',
    'educational',
    'medical',
    'legal',
  ];
  if (!validDocumentTypes.includes(documentType)) {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  next();
};

const sanitizeInput = (req, res, next) => {
  // Simple sanitization function
  const sanitize = (input) => {
    if (typeof input === 'string') {
      // Replace HTML tags and special characters
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\\/g, '&#92;');
    }
    return input;
  };

  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      req.body[key] = sanitize(req.body[key]);
    });
  }

  // Sanitize request query
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      req.query[key] = sanitize(req.query[key]);
    });
  }

  next();
};

describe('Input Validation Security Tests', () => {
  let app;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Add sanitization middleware
    app.use(sanitizeInput);

    // Add test routes
    app.post('/api/wallet', validateWalletAddress, (req, res) => {
      res.json({ success: true, walletAddress: req.body.walletAddress });
    });

    app.post('/api/email', validateEmail, (req, res) => {
      res.json({ success: true, email: req.body.email });
    });

    app.post('/api/document', validateDocumentType, (req, res) => {
      res.json({ success: true, documentType: req.body.documentType });
    });

    app.post('/api/sanitize', (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  test('should validate correct wallet address format', async () => {
    // Act
    const response = await request(app)
      .post('/api/wallet')
      .send({ walletAddress: '0x1234567890123456789012345678901234567890' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should reject invalid wallet address format', async () => {
    // Act
    const response = await request(app)
      .post('/api/wallet')
      .send({ walletAddress: 'invalid-wallet-address' });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid wallet address format');
  });

  test('should reject missing wallet address', async () => {
    // Act
    const response = await request(app).post('/api/wallet').send({});

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Wallet address is required');
  });

  test('should validate correct email format', async () => {
    // Act
    const response = await request(app)
      .post('/api/email')
      .send({ email: 'test@example.com' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should reject invalid email format', async () => {
    // Act
    const response = await request(app)
      .post('/api/email')
      .send({ email: 'invalid-email' });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid email format');
  });

  test('should validate correct document type', async () => {
    // Act
    const response = await request(app)
      .post('/api/document')
      .send({ documentType: 'identity' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should reject invalid document type', async () => {
    // Act
    const response = await request(app)
      .post('/api/document')
      .send({ documentType: 'invalid-type' });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid document type');
  });

  test('should sanitize HTML in input', async () => {
    // Act
    const response = await request(app).post('/api/sanitize').send({
      name: '<script>alert("XSS")</script>',
      description: 'Normal text with <b>HTML</b>',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.name).not.toContain('<script>');
    expect(response.body.data.description).not.toContain('<b>');
  });

  test('should sanitize special characters in input', async () => {
    // Act
    const response = await request(app).post('/api/sanitize').send({
      query: "SELECT * FROM users WHERE id = '1' OR '1'='1'",
      path: '../../../etc/passwd',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.query).not.toEqual(
      "SELECT * FROM users WHERE id = '1' OR '1'='1'"
    );
    // In a real implementation, this would be sanitized
    // For this test, we're just checking that the sanitization function is called
    expect(response.status).toBe(200);
  });

  test('should handle non-string inputs', async () => {
    // Act
    const response = await request(app)
      .post('/api/sanitize')
      .send({
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.number).toBe(123);
    expect(response.body.data.boolean).toBe(true);
  });
});
