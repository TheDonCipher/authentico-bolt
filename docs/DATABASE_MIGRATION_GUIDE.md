# Database Migration Guide for Organization Verification

This guide provides step-by-step instructions for migrating your Firestore database to support the new Organization Verification and Document Integration feature.

## Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Firebase Admin SDK service account key file
3. Node.js installed (v14 or later recommended)

## Migration Steps

### 1. Backup Your Database

Before making any changes, create a backup of your Firestore database:

```bash
firebase firestore:export gs://your-backup-bucket/firestore-backup
```

### 2. Verify Service Account File

Ensure your Firebase service account key file is in the root directory of your project. The migration script will look for the following files:

- `firebase-service-account.json`
- `serviceAccountKey.json`
- `@firebase-service-account.json`

If you have a service account file with a different name, you can either rename it to one of the above or modify the script to look for your specific filename.

### 3. Run the Migration Script

You can run all migration steps at once using the provided script:

```bash
node scripts/run-migration.js
```

This script will:

1. Create the Firestore indexes configuration
2. Update the Firestore security rules
3. Run the data migration

### 4. Deploy to Firebase

After running the migration script, deploy the changes to Firebase:

```bash
firebase deploy --only firestore:indexes,firestore:rules
```

Wait for the indexes to be created (this may take a few minutes).

### 5. Alternative: Run Migration Steps Individually

If you prefer to run the migration steps individually:

1. Create required indexes:

   ```bash
   node scripts/create-firestore-indexes.js
   firebase deploy --only firestore:indexes
   ```

2. Update security rules:

   ```bash
   node scripts/update-firestore-rules.js
   firebase deploy --only firestore:rules
   ```

3. Run data migration:
   ```bash
   node scripts/migrate-organization-verification.js
   ```

The migration script will:

- Update existing organization users with new verification fields
- Update existing organization applications with consistent status values
- Create initial audit log entries for existing verified organizations

### 6. Verify Migration

After running the migration, verify that:

1. Organization users have the new `verificationStatus` field
2. Organization applications have consistent status values
3. Audit logs have been created for verified organizations

You can check these in the Firebase Console or by running queries against your database.

## Troubleshooting

### Common Issues

#### Script Fails with Authentication Error

Make sure your Firebase service account key file is in the root directory and has the correct permissions. The script looks for files named `firebase-service-account.json`, `serviceAccountKey.json`, or `@firebase-service-account.json`.

#### Indexes Deployment Fails

Check that you have the correct permissions for your Firebase project. You may need to run `firebase login` first.

#### Migration Script Times Out

For large databases, the migration script might time out. You can modify the script to process data in smaller batches.

### Rollback Procedure

If you need to roll back the migration:

1. Restore your database from the backup:

   ```bash
   firebase firestore:import gs://your-backup-bucket/firestore-backup
   ```

2. Revert the security rules to your previous version

## Post-Migration Tasks

After successfully migrating your database:

1. Test the Organization Verification feature with test accounts
2. Verify that document upload and verification workflows work correctly
3. Check that notifications are being sent properly

## Support

If you encounter any issues during migration, please:

1. Check the error logs for specific error messages
2. Refer to the Firebase documentation for Firestore operations
3. Contact support if you need further assistance
