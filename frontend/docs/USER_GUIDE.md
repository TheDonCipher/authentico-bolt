# Authentico User Guide

Welcome to Authentico, the blockchain-based document verification platform. This guide will help you understand how to use the platform effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Individual User Guide](#individual-user-guide)
3. [Organization User Guide](#organization-user-guide)
4. [Document Verification](#document-verification)
5. [Sharing Documents](#sharing-documents)
6. [Security Features](#security-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Creating an Account

1. Visit the Authentico homepage at [https://authentico-demov2.vercel.app/](https://authentico-demov2.vercel.app/)
2. Click on the "Sign Up" button in the top right corner
3. Fill in your details:
   - Full Name
   - Email Address
   - Password (must be at least 8 characters and include uppercase, lowercase, number, and special character)
   - Confirm Password
4. Click "Create Account"
5. You will receive a verification email. Click the link to verify your account.

### Connecting Your Wallet

Authentico uses blockchain technology to secure your documents. To use the platform, you need to connect a cryptocurrency wallet.

1. After logging in, click on the "Connect Wallet" button
2. Choose your wallet provider (MetaMask, WalletConnect, etc.)
3. Follow the prompts to connect your wallet
4. Once connected, your wallet address will be displayed in your profile

### Navigating the Dashboard

The Authentico dashboard is your central hub for managing documents and verification requests.

- **Individual Dashboard**: Manage your documents, view verification status, and share verified documents
- **Organization Dashboard**: Review document verification requests, manage organization profile, and view verified documents
- **Admin Dashboard**: Manage users, organizations, and platform statistics (admin only)

## Individual User Guide

### Uploading Documents

1. From your individual dashboard, click on the "Upload Document" button
2. Fill in the document details:
   - Document Name
   - Document Description (optional)
   - Select the Verifying Organization from the dropdown
3. Upload your document file (PDF format, max 10MB)
4. Click "Upload"
5. Your document will be uploaded and sent to the selected organization for verification

### Viewing Documents

1. From your individual dashboard, you can view all your documents in the "My Documents" section
2. Documents are organized by status:
   - Pending: Documents waiting for verification
   - Verified: Documents that have been verified
   - Rejected: Documents that have been rejected
3. Click on a document to view its details, including:
   - Document name and description
   - Verification status
   - Verifying organization
   - Upload date
   - Verification date (if verified)
   - Transaction hash (if verified)
   - Rejection reason (if rejected)

### Re-uploading Rejected Documents

If your document is rejected, you can re-upload it:

1. Find the rejected document in your dashboard
2. Click on the document to view details
3. Read the rejection reason to understand why it was rejected
4. Click the "Re-upload" button
5. Upload a new version of the document
6. Add any additional information in the description field
7. Click "Submit"

## Organization User Guide

### Creating an Organization

1. Log in to your account
2. Click on "Create Organization" in the navigation menu
3. Fill in your organization details:
   - Organization Name
   - Description
   - Website
   - Contact Email
   - Contact Phone
   - Address
   - City
   - State
   - ZIP Code
   - Country
4. Click "Create Organization"
5. Your organization will be created with "Unverified" status

### Applying for Verification

To verify documents, your organization needs to be verified:

1. From your organization dashboard, click on "Apply for Verification"
2. Upload required documents to prove your organization's legitimacy
3. Add any additional notes for the admin
4. Click "Submit Application"
5. Your application will be reviewed by the admin
6. You will receive a notification when your application is approved or rejected

### Verifying Documents

Once your organization is verified, you can verify documents:

1. From your organization dashboard, go to the "Pending Documents" section
2. Review the documents submitted for verification
3. Click on a document to view its details
4. Review the document carefully
5. If the document is valid, click "Verify"
6. If the document is not valid, click "Reject" and provide a reason
7. The document will be verified on the blockchain, and the user will be notified

## Document Verification

### How Verification Works

Authentico uses blockchain technology to create a tamper-proof record of document verification:

1. User uploads a document and selects a verifying organization
2. The document is encrypted and stored securely on IPFS (InterPlanetary File System)
3. The organization reviews the document
4. If verified, a transaction is created on the blockchain with the document's hash
5. The verification is permanent and can be independently verified

### Verification Status

Documents in Authentico have one of three statuses:

- **Pending**: The document has been uploaded but not yet verified
- **Verified**: The document has been verified by the organization
- **Rejected**: The document has been rejected by the organization

### Verification Seal

Verified documents display a verification seal that includes:

- Verifying organization name
- Verification date
- Blockchain transaction hash
- QR code for quick verification

## Sharing Documents

### Generating Share Links

You can share your verified documents with others:

1. From your individual dashboard, find the verified document you want to share
2. Click on the document to view its details
3. Click the "Share" button
4. Choose how long the share link should be valid (1 day, 7 days, 30 days, or never expires)
5. Click "Generate Link"
6. Copy the link and share it with the recipient

### Viewing Shared Documents

Recipients of share links can view the document without creating an account:

1. Open the share link in a web browser
2. The document details will be displayed, including:
   - Document name and description
   - Verification status
   - Verifying organization
   - Verification date
   - Verification seal
3. The recipient can download the document if needed

## Security Features

### Encryption

All documents in Authentico are encrypted using AES-256 encryption:

- Documents are encrypted before being uploaded to IPFS
- The encryption key is securely stored and only accessible to authorized users
- Even if the IPFS hash is known, the document cannot be accessed without the encryption key

### Blockchain Anchoring

Verified documents are anchored to the blockchain:

- A transaction is created on the Sepolia testnet
- The transaction contains the document's hash
- The verification cannot be altered or deleted
- Anyone can independently verify the document's authenticity

### Access Control

Authentico implements strict access control:

- Individual users can only access their own documents
- Organizations can only access documents submitted to them
- Admins have access to platform management but not to document contents
- Share links provide temporary access to specific documents

## Troubleshooting

### Common Issues

#### Wallet Connection Issues

- Make sure you have a compatible wallet (MetaMask, WalletConnect, etc.)
- Ensure your wallet is connected to the Sepolia testnet
- Try refreshing the page and reconnecting your wallet
- Clear your browser cache and try again

#### Document Upload Issues

- Ensure your document is in PDF format
- Check that the file size is under 10MB
- Make sure you have selected a verifying organization
- Try uploading a different document to see if the issue persists

#### Verification Issues

- If your document is stuck in "Pending" status, contact the verifying organization
- If your document is rejected, read the rejection reason and re-upload with corrections
- If verification fails due to a blockchain error, try again later

### Getting Help

If you encounter any issues not covered in this guide:

- Check the FAQ section on the Authentico website
- Contact support at support@authentico.com
- Join the Authentico community forum for peer assistance

### Reporting Security Issues

If you discover a security vulnerability:

- Do not disclose it publicly
- Email security@authentico.com with details
- Include steps to reproduce the vulnerability
- We will respond promptly and work to address the issue
