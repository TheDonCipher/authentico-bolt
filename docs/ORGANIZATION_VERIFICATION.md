# Organization Verification Feature

This document outlines the Organization Verification feature in the Authentico platform, which enables organizations to request verified status and administrators to manage these requests.

## Overview

The Organization Verification feature allows:

1. Organizations to apply for verified status
2. Administrators to review, approve, or reject verification applications
3. Verified organizations to verify documents submitted by users
4. Users to identify verified organizations when submitting documents

## User Flows

### Organization Verification Application

1. Organization users access the verification application form from their dashboard
2. They submit required information including:
   - Organization name
   - Contact email
   - Website
   - Description
   - Address
   - Phone number
   - Industry
   - Registration/license number
   - Founded year
   - Document types they can verify
3. Upon submission, the application status is set to "pending"
4. Administrators are notified of the new application
5. The organization can view their application status in their dashboard

### Admin Review Process

1. Administrators access the Organization Applications section in the admin dashboard
2. They can view all applications and filter by status (pending, approved, rejected)
3. For each application, they can:
   - View detailed information
   - Approve the application
   - Reject the application with a reason
4. When an application is approved:
   - The organization's status is updated to "verified"
   - The organization receives a notification
   - The organization appears in the verified organizations list for document uploads
5. When an application is rejected:
   - The organization receives a notification with the rejection reason
   - The organization can submit a new application

### Verified Organization Benefits

Verified organizations can:

1. Verify documents submitted by users
2. Display a verification badge on their profile
3. Appear in the verified organizations list for document uploads
4. Anchor verifications on the blockchain

## Technical Implementation

### Data Model

**Organization Applications Collection**
```
{
  orgName: string,
  contactEmail: string,
  website: string,
  description: string,
  address: string,
  phoneNumber: string,
  industry: string,
  registrationNumber: string,
  foundedYear: string,
  documentTypes: string[],
  status: 'pending' | 'approved' | 'rejected',
  submittedBy: string (user ID),
  submittedAt: timestamp,
  updatedAt: timestamp,
  updatedBy: string (admin ID),
  notes: string (rejection reason)
}
```

**Users Collection (Organization)**
```
{
  uid: string,
  email: string,
  name: string,
  userType: 'organization',
  isVerified: boolean,
  website: string,
  description: string,
  address: string,
  phoneNumber: string,
  industry: string,
  registrationNumber: string,
  foundedYear: string,
  documentTypes: string[],
  verificationBadge: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### API Endpoints

**Organization Routes**
- `POST /api/organizations/apply` - Submit an organization application
- `GET /api/organizations/application/status` - Get current user's application status
- `GET /api/organizations/verified` - Get all verified organizations
- `GET /api/organizations/applications` (admin only) - Get all organization applications
- `PUT /api/organizations/applications/:applicationId` (admin only) - Update application status

### Notifications

The system sends notifications to:
- Administrators when a new application is submitted
- Organizations when their application is approved or rejected

## Testing

A test script is provided to test the organization verification feature:
- `test-scripts/test-organization-verification.js`

This script tests:
1. Organization application submission
2. Admin approval/rejection
3. Notifications

To run the test:
```
node test-scripts/test-organization-verification.js
```

## Security

- Only authenticated users can submit organization applications
- Only the submitter can view their own application
- Only admins can view all applications and update application status
- Firestore rules enforce these security constraints
