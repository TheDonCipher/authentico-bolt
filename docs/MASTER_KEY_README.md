# Master Key for Document Encryption

This document explains the master key system used for document encryption in Authentico.

## Overview

Authentico uses a multi-layered encryption approach to secure documents:

1. **Master Key**: A high-security key used to encrypt/decrypt the Data Encryption Keys (DEKs)
2. **Data Encryption Keys (DEKs)**: Unique keys generated for each document
3. **Encrypted Documents**: Each document is encrypted with its own DEK

This approach follows security best practices by:
- Never storing the master key in the database
- Using a unique encryption key for each document
- Implementing AES-256-GCM encryption (authenticated encryption)

## Generating a Master Key

To generate a secure master key for your environment:

```bash
npm run generate:master-key
```

This script will:
1. Generate a cryptographically secure random key
2. Display the key and instructions for setting it as an environment variable
3. Offer to update your `.env` file automatically (if it exists)

## Setting Up the Master Key

The master key must be set as an environment variable named `MASTER_KEY_SECRET` in your backend environment.

### Development Environment

Add to your `.env` file:

```
MASTER_KEY_SECRET=your_generated_key_here
```

### Production Environment

Set the environment variable securely in your production environment:

- **Heroku**: Use the Heroku CLI or dashboard to set config vars
- **Vercel**: Use the Vercel dashboard or CLI to set environment variables
- **AWS**: Use AWS Parameter Store or Secrets Manager
- **Docker**: Use Docker environment variables or secrets

## Security Considerations

1. **Never commit** your master key to version control
2. **Rotate the key** periodically for enhanced security
3. **Backup the key** securely - if lost, encrypted documents cannot be recovered
4. **Limit access** to the master key to only essential personnel

## How It Works

When a document is uploaded:

1. A unique Data Encryption Key (DEK) is generated
2. The document is encrypted with this DEK
3. The DEK is encrypted with the master key
4. The encrypted DEK is stored in the database alongside the document metadata
5. The encrypted document is stored in IPFS

When a document is downloaded:

1. The encrypted DEK is retrieved from the database
2. The master key decrypts the DEK
3. The DEK decrypts the document
4. The decrypted document is served to the authorized user

This approach ensures that even if the database is compromised, the documents remain secure without the master key.

## Troubleshooting

If you encounter errors related to document encryption or decryption:

1. Verify that the `MASTER_KEY_SECRET` environment variable is set correctly
2. Ensure the master key hasn't changed since the documents were encrypted
3. Check that the encryption service has the correct permissions

For security reasons, encryption errors may not provide detailed information in production environments.
