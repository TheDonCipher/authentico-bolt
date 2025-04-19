# Organization Verification System

This document provides a comprehensive guide to the Organization Verification system in Authentico.

## Overview

The Organization Verification system allows organizations to apply for verification status, which grants them the ability to verify documents submitted by users. The verification process involves several steps:

1. Organization submits a verification application
2. Admin reviews the application
3. Admin approves or rejects the application
4. Organization receives notification of the decision
5. If approved, the organization can now verify documents

## Organization Verification Statuses

Organizations can have one of the following verification statuses:

- **Not Verified**: Default status for new organizations
- **Pending Verification**: Organization has submitted a verification application that is awaiting review
- **Verified**: Organization has been approved by an admin
- **Rejected**: Organization's verification application has been rejected by an admin

## User Flows

### Organization Application Flow

1. Organization registers on the platform
2. Organization navigates to their dashboard
3. Organization clicks "Apply for Verification" button
4. Organization fills out the application form with required details:
   - Organization Name
   - Contact Email
   - Website
   - Description (optional)
   - Address (optional)
   - Phone Number (optional)
   - Industry (optional)
   - Registration Number (optional)
   - Founded Year (optional)
   - Document Types they can verify (optional)
5. Organization submits the application
6. Application status changes to "Pending Verification"
7. Admin receives notification of new application

### Admin Review Flow

1. Admin logs in to the admin dashboard
2. Admin navigates to the Organization Applications section
3. Admin reviews pending applications
4. Admin can view details of each application
5. Admin approves or rejects the application
   - If rejecting, admin provides a reason
6. Organization receives notification of the decision

### Document Upload Flow (for Users)

1. User logs in to their dashboard
2. User clicks "Upload Document" button
3. User selects a document to upload
4. User selects a verified organization to verify the document
   - Only verified organizations appear in the dropdown
5. User submits the document
6. Selected organization receives notification of new document to verify

### Document Verification Flow (for Organizations)

1. Verified organization logs in to their dashboard
2. Organization navigates to the Document Reception section
3. Organization reviews documents submitted for verification
4. Organization can view document details
5. Organization approves or rejects the document
   - If rejecting, organization provides a reason
6. User receives notification of the decision

## Technical Implementation

### Data Model

#### User Collection

```
{
  uid: string,
  walletAddress: string,
  userType: 'individual' | 'organization' | 'admin',
  name: string,
  organizationName?: string,
  verificationStatus: 'not_verified' | 'pending' | 'verified' | 'rejected',
  isVerified: boolean,
  verificationRejectionReason?: string,
  verificationUpdatedAt?: timestamp,
  verificationUpdatedBy?: string,
  email?: string
}
```

#### Organization Applications Collection

```
{
  id: string,
  orgName: string,
  contactEmail: string,
  website: string,
  description?: string,
  address?: string,
  phoneNumber?: string,
  industry?: string,
  registrationNumber?: string,
  foundedYear?: string,
  documentTypes?: string[],
  status: 'pending' | 'verified' | 'rejected',
  submittedBy: string (user ID),
  organizationId: string (user ID),
  submittedAt: timestamp,
  updatedAt?: timestamp,
  updatedBy?: string (admin ID),
  notes?: string (rejection reason)
}
```

#### Verification Audit Logs Collection

```
{
  id: string,
  organizationId: string,
  organizationName: string,
  oldStatus: 'not_verified' | 'pending' | 'verified' | 'rejected',
  newStatus: 'not_verified' | 'pending' | 'verified' | 'rejected',
  updatedBy: string (admin ID),
  updatedByName: string,
  updatedAt: timestamp,
  notes?: string
}
```

#### Notifications Collection

```
{
  id: string,
  userId: string,
  type: string,
  title: string,
  message: string,
  read: boolean,
  createdAt: timestamp,
  metadata?: object
}
```

### API Endpoints

#### Organization Routes

- `POST /api/organizations/apply` - Submit an organization application
- `GET /api/organizations/application/status` - Get current user's application status
- `GET /api/organizations/verified` - Get all verified organizations
- `GET /api/organizations/applications` (admin only) - Get all organization applications
- `PUT /api/organizations/applications/:applicationId` (admin only) - Update application status

#### Admin Routes

- `GET /api/admin/audit-logs` (admin only) - Get all verification audit logs

### Notifications

The system sends notifications to:

- Administrators when a new application is submitted
- Organizations when their application is approved or rejected
- Organizations when a new document is submitted for verification
- Users when their document is verified or rejected

## Security Considerations

- Only admins can approve or reject organization applications
- Only verified organizations can verify documents
- Audit logs track all verification status changes
- All API endpoints are protected with authentication
- Admin endpoints have additional authorization checks

## Testing

To test the organization verification feature:

1. Register as an organization
2. Submit a verification application
3. Log in as an admin
4. Approve or reject the application
5. Log back in as the organization
6. Verify that the status has changed
7. If approved, verify that you can now verify documents

## Troubleshooting

### Common Issues

- **Application not showing up in admin dashboard**: Check that the application was submitted successfully and that you're logged in as an admin.
- **Organization not appearing in document upload dropdown**: Check that the organization has been verified by an admin.
- **Verification status not updating**: Check that the admin has approved or rejected the application and that you're viewing the correct organization dashboard.

### Error Handling

- All API endpoints return appropriate error messages and status codes
- Client-side validation prevents submission of invalid data
- Server-side validation ensures data integrity
- Audit logs help track issues with the verification process
