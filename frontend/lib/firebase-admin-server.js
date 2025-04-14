// This file is only used in API routes (server-side)

import admin from 'firebase-admin';

// Service account credentials with fallback values
const serviceAccountKey = {
  type: process.env.FIREBASE_TYPE || 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'authentico-backend',
  private_key_id:
    process.env.FIREBASE_PRIVATE_KEY_ID ||
    'f21cf9b60fa17b580d86b6cf4ba46ffc8fb6ce09',
  private_key: (
    process.env.FIREBASE_PRIVATE_KEY ||
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCxBt8kRnHWQnYE\nVZnJZVs+cKQ9JW1GL9+azzXnMoQyW1zQtJmuy8JYhMSKQzD5xY9tp3K0fTQGXUIU\nCQBWXJLGDJoHbxXFu8GZdV8MuLDuGUxYlUGCCsKGKBzrAHBJlocKRGLWvqCvEPXd\nQGg0pRnVX4QNAL4+aKY5z7bH9ExUsFvUKxBvZ4GIq5Ou5wy3XfKcpKvOmLEUYiPu\nJrYzGRUQvRVLMBKT/xOhkHYemlvXVkPJzWQYOUYGJkAjNNKjXJ3hB8wGQ3OLkJEv\nYrHKe5hQzxmA/TGQ7/EN5UkADd7uc83qIO3kLI5YUXQfy4EQgDu9NjZXlEMvfOLa\nxJwEyBQnAgMBAAECggEABEi0AJlnJYsQPIEpnLlRlNe9vJlGxmgpNFDixLXYH/vW\nJcH377ydOWiKcKxQG5q5zLQRfxQn2YiT+5w9C3c1MLyrBgXQFZwkCBwQSxdlcACl\nEJqeq5cmnvKuZF9KV0ub76NzEpYYCTb8wfbwQBWpYQBzNvYQRVFpKVn2fAUGndKg\nGnLGdnHXWZWd6jh6g+xEH5G1+C4jP7/cAQEHbq/tS+H0jrJ1MdHMP6fNUZpbPMxP\nZFXxzwDWLQVKsZWvSi7JFQQdxjGUMqHC+UMt2C9KwZOFVJQBZ9QApj6/t0GKwSqf\nBJQQIhx6Lk5v9HGlqjVCvMRUZ6UOQPpCyXm+qz/YAQKBgQDrEQ+NqTvpFHOvYfSO\nWa1wtWQGqQiXIXPZDjI2xvRvTXYPqrCxYAJBOqXx5PbKJt9V3R/AQ5GQwzqQ5l78\nkIGhGBgYCQj1TZLKLlXf5bKE5D+cYNMSA4RCZ5eqUKtVo7VBP8QR8jPyFPvQUhIv\nfn84c1aNN4CDcm1qOLm5jzYuAQKBgQDBCXMThwYaLBdZENjdF+QsqAKNgCIStY73\nZVIYA/uDxMGvVPxYZOUYcBcJvLluQJX6MYJ4Cj2HlpzKvwB0o9/YPYsI+7UBCmx6\n2+/BxM8w5Z7v8GB9Q0hKTvmk5VNXZHZyNyoZJeMOlYa3ixq5o8AJHdwQKLQJ5DrL\nLhyEvQdOBwKBgQCvx9O+Aq1JmTZYAXhAHOllWM6cEiXnhzQXWvYCtIHs6jBKS7V9\nZTxUoFYp0cYkC+qYmRnKGRGye7l2JEVFfQJEJ7++Tg8q6c7Cj7HYLAhQrUaZr9/t\nAXZyoqUFdm8YTMeIkXcXMUFDUBYFDQRWkJVIyDL9idsUFIoYG7LKAUjAAQKBgHGj\nTVTXNXKsRJHoGUfSUVK8hbUcuQzGoRYQHFRwGqwfLMDQkQbTYYtYBpGvLMgYWZl0\nA1Uf5XPx94ILQRkxWnBCv9vX6m2BIAUR4jRIwIYXCRMNMCL4Kn3QWGrORNWEGtYF\nTHxmP5jnZxU/Ujivs7+MCuEwNkO8UvZOqHDwQQMRAoGAQOgVyFZlU8T/9qkR8Ljw\nPvpXMvIcEyWdyMxvwYcEQLGF2AwzTxzIZQRXMWgwgVgK5Y+XJNPmLRuRLYe6DNdJ\nK7y8UxCK5jqiQwBhU9JHooGIERULXvXKPj7jUTL5+lCy8XRcLHbwJ3KPIXaGvyJH\nGxdmjlOlZ3HbJgMBLmOzQkA=\n-----END PRIVATE KEY-----\n'
  ).replace(/\\n/g, '\n'),
  client_email:
    process.env.FIREBASE_CLIENT_EMAIL ||
    'firebase-adminsdk-fbsvc@authentico-backend.iam.gserviceaccount.com',
  client_id: process.env.FIREBASE_CLIENT_ID || '107591713606685347756',
  auth_uri:
    process.env.FIREBASE_AUTH_URI ||
    'https://accounts.google.com/o/oauth2/auth',
  token_uri:
    process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
    'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    process.env.FIREBASE_CLIENT_X509_CERT_URL ||
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40authentico-backend.iam.gserviceaccount.com',
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com',
};

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export the admin services
export const db = admin.firestore();
export const auth = admin.auth();
