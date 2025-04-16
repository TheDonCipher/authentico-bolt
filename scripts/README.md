# Authentico Scripts

This directory contains utility scripts for the Authentico application.

## Seed Verified Organizations

The `seed-verified-organizations.js` script seeds the Firestore database with verified organizations that can be used for document verification in the demo environment.

### Prerequisites

- Firebase credentials must be set up either through environment variables or a `firebase-service-account.json` file in the project root.
- The `uuid` package must be installed.

### Usage

Run the script using npm:

```bash
npm run seed:verified-orgs
```

### What the Script Does

1. Initializes the Firebase Admin SDK using either environment variables or a service account file.
2. Checks if there are already verified organizations in the database.
3. If verified organizations exist, asks if you want to add more.
4. Creates new verified organization records in the Firestore database.
5. Each organization includes:
   - Basic information (name, email, website, etc.)
   - Industry-specific details
   - Document types they can verify
   - Verification badge status

### Sample Organizations

The script creates the following verified organizations:

1. **National Identity Authority** - Government organization for identity verification
2. **Global Education Verification** - Educational credentials verification
3. **Corporate Employment Verification** - Employment document verification
4. **Financial Document Authority** - Financial document verification
5. **Legal Document Verification** - Legal document verification

### Customization

You can modify the `verifiedOrganizations` array in the script to add or change the organizations that will be seeded.

## Other Scripts

- `validate-env.js` - Validates environment variables
- `setup-env.js` - Sets up environment variables from templates
