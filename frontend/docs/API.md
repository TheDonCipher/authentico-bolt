# Authentico API Documentation

This document provides comprehensive documentation for the Authentico API, including endpoints, request/response formats, authentication, and error handling.

## Table of Contents

1. [Authentication](#authentication)
2. [Documents](#documents)
3. [Organizations](#organizations)
4. [Users](#users)
5. [Notifications](#notifications)
6. [Admin](#admin)
7. [Error Handling](#error-handling)

## Authentication

The Authentico API uses JWT tokens for authentication. All authenticated endpoints require a valid JWT token in the Authorization header.

### Endpoints

#### POST /auth/login

Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "individual"
  }
}
```

#### POST /auth/register

Registers a new user and returns a JWT token.

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "individual"
  }
}
```

#### GET /auth/me

Returns the currently authenticated user.

**Response:**
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "individual"
}
```

#### POST /auth/logout

Logs out the current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Documents

### Endpoints

#### POST /documents

Uploads a new document.

**Request:**
```
Content-Type: multipart/form-data

file: [File]
name: "Passport"
description: "My passport document"
organizationId: "org123"
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc123",
  "message": "Document uploaded successfully"
}
```

#### GET /documents

Returns a list of documents for the current user.

**Query Parameters:**
- `status` (optional): Filter by document status (pending, verified, rejected)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of documents per page

**Response:**
```json
{
  "documents": [
    {
      "id": "doc123",
      "name": "Passport",
      "description": "My passport document",
      "status": "pending",
      "organizationId": "org123",
      "organizationName": "Government Agency",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### GET /documents/:id

Returns a specific document.

**Response:**
```json
{
  "document": {
    "id": "doc123",
    "name": "Passport",
    "description": "My passport document",
    "status": "pending",
    "organizationId": "org123",
    "organizationName": "Government Agency",
    "ipfsHash": "QmTest123",
    "transactionHash": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /documents/:id/verify

Verifies a document (organization only).

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc123",
    "status": "verified",
    "transactionHash": "0x123456789",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Document verified successfully"
}
```

#### PUT /documents/:id/reject

Rejects a document (organization only).

**Request:**
```json
{
  "reason": "Document is not valid"
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc123",
    "status": "rejected",
    "rejectionReason": "Document is not valid",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Document rejected successfully"
}
```

#### POST /documents/:id/reupload

Re-uploads a rejected document.

**Request:**
```
Content-Type: multipart/form-data

file: [File]
description: "Updated passport document"
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc123",
  "message": "Document re-uploaded successfully"
}
```

#### POST /documents/:id/share

Generates a share link for a document.

**Request:**
```json
{
  "expiryDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "shareLink": "https://authentico.com/share/doc123?token=abc123",
  "expiresAt": "2023-01-08T00:00:00.000Z"
}
```

#### GET /documents/share/:id

Returns a shared document.

**Query Parameters:**
- `token`: Share token

**Response:**
```json
{
  "document": {
    "id": "doc123",
    "name": "Passport",
    "description": "My passport document",
    "status": "verified",
    "organizationId": "org123",
    "organizationName": "Government Agency",
    "ipfsHash": "QmTest123",
    "transactionHash": "0x123456789",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

## Organizations

### Endpoints

#### POST /organizations

Creates a new organization.

**Request:**
```json
{
  "organizationName": "Government Agency",
  "description": "Official government agency",
  "website": "https://example.gov",
  "contactEmail": "contact@example.gov",
  "contactPhone": "1234567890",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "Anystate",
  "zipCode": "12345",
  "country": "United States"
}
```

**Response:**
```json
{
  "success": true,
  "organizationId": "org123",
  "message": "Organization created successfully"
}
```

#### GET /organizations

Returns a list of organizations.

**Query Parameters:**
- `status` (optional): Filter by organization status (unverified, pending, verified, rejected)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of organizations per page

**Response:**
```json
{
  "organizations": [
    {
      "id": "org123",
      "organizationName": "Government Agency",
      "description": "Official government agency",
      "website": "https://example.gov",
      "contactEmail": "contact@example.gov",
      "status": "verified",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### GET /organizations/:id

Returns a specific organization.

**Response:**
```json
{
  "organization": {
    "id": "org123",
    "organizationName": "Government Agency",
    "description": "Official government agency",
    "website": "https://example.gov",
    "contactEmail": "contact@example.gov",
    "contactPhone": "1234567890",
    "address": "123 Main St",
    "city": "Anytown",
    "state": "Anystate",
    "zipCode": "12345",
    "country": "United States",
    "status": "verified",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### PUT /organizations/:id

Updates an organization.

**Request:**
```json
{
  "organizationName": "Updated Government Agency",
  "description": "Updated description",
  "website": "https://updated.example.gov",
  "contactEmail": "updated@example.gov"
}
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": "org123",
    "organizationName": "Updated Government Agency",
    "description": "Updated description",
    "website": "https://updated.example.gov",
    "contactEmail": "updated@example.gov",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Organization updated successfully"
}
```

#### POST /organizations/:id/apply

Applies for organization verification.

**Request:**
```json
{
  "documents": ["doc1", "doc2"],
  "notes": "Please verify our organization"
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "app123",
  "message": "Verification application submitted successfully",
  "status": "pending"
}
```

#### GET /organizations/:id/documents

Returns documents for an organization.

**Query Parameters:**
- `status` (optional): Filter by document status (pending, verified, rejected)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of documents per page

**Response:**
```json
{
  "documents": [
    {
      "id": "doc123",
      "name": "Passport",
      "description": "My passport document",
      "status": "pending",
      "userId": "user123",
      "userName": "John Doe",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### PUT /organizations/applications/:id/approve

Approves an organization verification application (admin only).

**Request:**
```json
{
  "comment": "Application approved"
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "app123",
  "message": "Verification application approved",
  "status": "verified"
}
```

#### PUT /organizations/applications/:id/reject

Rejects an organization verification application (admin only).

**Request:**
```json
{
  "reason": "Missing required documents"
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "app123",
  "message": "Verification application rejected",
  "status": "rejected"
}
```

## Users

### Endpoints

#### GET /users/profile

Returns the profile of the current user.

**Response:**
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "individual",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### PUT /users/profile

Updates the profile of the current user.

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "Updated Name",
    "email": "updated@example.com",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

#### PUT /users/password

Changes the password of the current user.

**Request:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Notifications

### Endpoints

#### GET /notifications

Returns notifications for the current user.

**Query Parameters:**
- `unread` (optional): Filter by read status (true/false)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of notifications per page

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif123",
      "userId": "user123",
      "type": "document_verified",
      "message": "Your document \"Passport\" has been verified by Government Agency",
      "documentId": "doc123",
      "read": false,
      "createdAt": "2023-01-02T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### GET /notifications/count

Returns the count of notifications for the current user.

**Query Parameters:**
- `unread` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "count": 1
}
```

#### PUT /notifications/:id/read

Marks a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### PUT /notifications/read-all

Marks all notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### DELETE /notifications/:id

Deletes a notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

## Admin

### Endpoints

#### GET /admin/statistics

Returns platform statistics (admin only).

**Response:**
```json
{
  "totalUsers": 100,
  "totalOrganizations": 20,
  "totalDocuments": 500,
  "verifiedDocuments": 300,
  "pendingDocuments": 150,
  "rejectedDocuments": 50,
  "verifiedOrganizations": 15,
  "pendingOrganizations": 3,
  "rejectedOrganizations": 2,
  "documentsPerDay": [
    { "date": "2023-01-01", "count": 10 },
    { "date": "2023-01-02", "count": 15 }
  ],
  "usersPerDay": [
    { "date": "2023-01-01", "count": 5 },
    { "date": "2023-01-02", "count": 8 }
  ]
}
```

#### GET /admin/users

Returns a list of users (admin only).

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of users per page

**Response:**
```json
{
  "users": [
    {
      "id": "user123",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "individual",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### GET /admin/organizations

Returns a list of organizations (admin only).

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of organizations per page

**Response:**
```json
{
  "organizations": [
    {
      "id": "org123",
      "organizationName": "Government Agency",
      "description": "Official government agency",
      "website": "https://example.gov",
      "contactEmail": "contact@example.gov",
      "status": "verified",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 10
}
```

#### GET /admin/documents

Returns a list of documents (admin only).

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of documents per page

**Response:**
```json
{
  "documents": [
    {
      "id": "doc123",
      "name": "Passport",
      "description": "My passport document",
      "status": "verified",
      "userId": "user123",
      "userName": "John Doe",
      "organizationId": "org123",
      "organizationName": "Government Agency",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 10
}
```

#### GET /admin/applications

Returns a list of organization verification applications (admin only).

**Query Parameters:**
- `status` (optional): Filter by application status (pending, approved, rejected)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of applications per page

**Response:**
```json
{
  "applications": [
    {
      "id": "app123",
      "organizationId": "org123",
      "status": "pending",
      "documents": ["doc1", "doc2"],
      "notes": "Please verify our organization",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "organization": {
        "id": "org123",
        "organizationName": "Government Agency",
        "description": "Official government agency",
        "website": "https://example.gov",
        "contactEmail": "contact@example.gov",
        "status": "pending"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

#### GET /admin/audit-logs

Returns audit logs (admin only).

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of logs per page

**Response:**
```json
{
  "logs": [
    {
      "id": "log123",
      "userId": "user123",
      "action": "document_verified",
      "resourceType": "document",
      "resourceId": "doc123",
      "details": {
        "organizationId": "org123",
        "transactionHash": "0x123456789"
      },
      "timestamp": "2023-01-02T00:00:00.000Z",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "email": "user@example.com"
      }
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 10
}
```

#### PUT /admin/users/:id/disable

Disables a user (admin only).

**Request:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User disabled successfully"
}
```

#### PUT /admin/users/:id/enable

Enables a user (admin only).

**Response:**
```json
{
  "success": true,
  "message": "User enabled successfully"
}
```

#### PUT /admin/organizations/:id/disable

Disables an organization (admin only).

**Request:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization disabled successfully"
}
```

#### PUT /admin/organizations/:id/enable

Enables an organization (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Organization enabled successfully"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. In case of an error, the response will include an error message and, if applicable, additional details.

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  }
}
```

### Common Error Codes

- `400 Bad Request`: The request was invalid or cannot be served.
- `401 Unauthorized`: Authentication is required or has failed.
- `403 Forbidden`: The authenticated user does not have permission to access the requested resource.
- `404 Not Found`: The requested resource does not exist.
- `409 Conflict`: The request could not be completed due to a conflict with the current state of the resource.
- `422 Unprocessable Entity`: The request was well-formed but was unable to be followed due to semantic errors.
- `429 Too Many Requests`: The user has sent too many requests in a given amount of time.
- `500 Internal Server Error`: An error occurred on the server.

### Error Types

#### Authentication Errors

- `AUTHENTICATION_ERROR`: Authentication failed.
- `TOKEN_EXPIRED`: JWT token has expired.
- `INVALID_TOKEN`: JWT token is invalid.

#### Authorization Errors

- `AUTHORIZATION_ERROR`: User does not have permission to access the resource.
- `INSUFFICIENT_PERMISSIONS`: User does not have sufficient permissions to perform the action.

#### Validation Errors

- `VALIDATION_ERROR`: Request data failed validation.
- `INVALID_INPUT`: Input data is invalid.
- `MISSING_REQUIRED_FIELD`: A required field is missing.

#### Resource Errors

- `RESOURCE_NOT_FOUND`: The requested resource does not exist.
- `RESOURCE_ALREADY_EXISTS`: The resource already exists.
- `RESOURCE_CONFLICT`: The request conflicts with the current state of the resource.

#### Rate Limit Errors

- `RATE_LIMIT_EXCEEDED`: The user has sent too many requests in a given amount of time.

#### Server Errors

- `SERVER_ERROR`: An error occurred on the server.
- `DATABASE_ERROR`: An error occurred while accessing the database.
- `EXTERNAL_SERVICE_ERROR`: An error occurred while communicating with an external service.

### Example Error Responses

#### Authentication Error

```json
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password"
}
```

#### Validation Error

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "name": "Name is required",
    "email": "Invalid email format"
  }
}
```

#### Resource Not Found Error

```json
{
  "error": "RESOURCE_NOT_FOUND",
  "message": "Document not found"
}
```

#### Rate Limit Error

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "details": {
    "resetTime": 1609459200,
    "remainingRequests": 0
  }
}
```

#### Server Error

```json
{
  "error": "SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```
