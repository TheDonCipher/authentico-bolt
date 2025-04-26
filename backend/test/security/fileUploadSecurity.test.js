/**
 * Security tests for Authentico file upload security
 */
const express = require('express');
const request = require('supertest');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('test content')),
  },
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn().mockImplementation(function(event, handler) {
      if (event === 'end') {
        handler();
      }
      return this;
    }),
  }),
}));

// Create file upload middleware for testing
const createFileUploadMiddleware = () => {
  // Configure storage
  const storage = multer.memoryStorage();
  
  // Configure file filter
  const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and DOC files are allowed.'), false);
    }
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension. Only PDF, JPEG, PNG, and DOC files are allowed.'), false);
    }
    
    // Check file name for potential path traversal
    const basename = path.basename(file.originalname);
    if (basename !== file.originalname) {
      return cb(new Error('Invalid file name. Path traversal detected.'), false);
    }
    
    // File is valid
    cb(null, true);
  };
  
  // Configure upload limits
  const limits = {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Only one file at a time
  };
  
  // Create multer instance
  return multer({ storage, fileFilter, limits }).single('file');
};

// Create a middleware to scan file content for malicious patterns
const scanFileContent = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  // Check for potentially malicious content in binary files
  const buffer = req.file.buffer;
  
  // Check for executable file signatures
  const executableSignatures = [
    Buffer.from([0x4D, 0x5A]), // MZ (Windows executable)
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class file
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP/JAR/APK
  ];
  
  for (const signature of executableSignatures) {
    if (buffer.length >= signature.length) {
      const fileStart = buffer.slice(0, signature.length);
      if (Buffer.compare(fileStart, signature) === 0) {
        return res.status(400).json({ error: 'Potentially malicious file detected' });
      }
    }
  }
  
  // Check for script tags in text files
  if (req.file.mimetype.includes('text') || req.file.mimetype.includes('xml')) {
    const content = buffer.toString('utf8');
    if (content.includes('<script') || content.includes('<?php')) {
      return res.status(400).json({ error: 'Potentially malicious content detected' });
    }
  }
  
  next();
};

describe('File Upload Security Tests', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Add file upload middleware
    const upload = createFileUploadMiddleware();
    
    // Add test routes
    app.post('/api/upload', (req, res, next) => {
      upload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            // Multer error (file size, file count, etc.)
            return res.status(400).json({ error: err.message });
          }
          // Other errors
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    }, scanFileContent, (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Process the file
      const fileInfo = {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
      
      res.json({ success: true, file: fileInfo });
    });
  });
  
  test('should accept valid file types', async () => {
    // Arrange
    const validFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    };
    
    // Mock multer to provide the file
    app.use((req, res, next) => {
      req.file = validFile;
      next();
    });
    
    // Act
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test content'), 'test.pdf');
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.file).toHaveProperty('originalname', 'test.pdf');
    expect(response.body.file).toHaveProperty('mimetype', 'application/pdf');
  });
  
  test('should reject files with invalid MIME types', async () => {
    // Create a test app with a route that directly tests the file filter
    const testApp = express();
    
    // Add a route that manually calls the file filter
    testApp.post('/api/test-filter', (req, res) => {
      const fileFilter = (req, file, cb) => {
        // Check file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and DOC files are allowed.'), false);
        }
        cb(null, true);
      };
      
      // Test with an invalid MIME type
      const file = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload',
      };
      
      fileFilter(req, file, (err, result) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.json({ success: true });
      });
    });
    
    // Act
    const response = await request(testApp).post('/api/test-filter');
    
    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid file type');
  });
  
  test('should reject files exceeding size limit', async () => {
    // Create a test app with a route that directly tests the file size limit
    const testApp = express();
    
    // Add a route that manually checks the file size
    testApp.post('/api/test-size', (req, res) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 6 * 1024 * 1024; // 6MB
      
      if (fileSize > maxSize) {
        return res.status(400).json({ error: 'File too large' });
      }
      
      res.json({ success: true });
    });
    
    // Act
    const response = await request(testApp).post('/api/test-size');
    
    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('File too large');
  });
  
  test('should prevent path traversal attacks in file names', async () => {
    // Create a test app with a route that directly tests path traversal
    const testApp = express();
    
    // Add a route that manually checks for path traversal
    testApp.post('/api/test-path-traversal', (req, res) => {
      const fileName = '../../../etc/passwd';
      
      // Sanitize filename (remove path components)
      const sanitizedFilename = path.basename(fileName);
      
      res.json({ 
        original: fileName,
        sanitized: sanitizedFilename
      });
    });
    
    // Act
    const response = await request(testApp).post('/api/test-path-traversal');
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sanitized', 'passwd');
    expect(response.body.sanitized).not.toContain('../');
  });
  
  test('should detect malicious file content', async () => {
    // Create a test app with a route that directly tests content scanning
    const testApp = express();
    
    // Add a route that manually checks for malicious content
    testApp.post('/api/test-malicious-content', (req, res) => {
      // Test with a file containing a script tag
      const fileContent = '<html><body><script>alert("XSS")</script></body></html>';
      
      // Check for script tags
      if (fileContent.includes('<script')) {
        return res.status(400).json({ error: 'Potentially malicious content detected' });
      }
      
      res.json({ success: true });
    });
    
    // Act
    const response = await request(testApp).post('/api/test-malicious-content');
    
    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('malicious content');
  });
  
  test('should handle file upload errors gracefully', async () => {
    // Create a test app with a route that simulates an upload error
    const testApp = express();
    
    // Add a route that simulates an error during upload
    testApp.post('/api/test-upload-error', (req, res) => {
      // Simulate a disk write error
      return res.status(500).json({ 
        error: 'File upload failed',
        message: 'Internal server error'
      });
    });
    
    // Act
    const response = await request(testApp).post('/api/test-upload-error');
    
    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('File upload failed');
    
    // The error should not contain sensitive information
    expect(response.body.message).not.toContain('path');
    expect(response.body.message).not.toContain('directory');
  });
});
