# User Collection Migration

This directory contains scripts to help with database migrations and maintenance.

## Migrating User Data

The `migrateUsers.js` script is designed to move user data from the old "Users" (uppercase) collection to the new standardized "users" (lowercase) collection.

### Why This Migration Is Needed

We've standardized our codebase to use a single "users" (lowercase) collection for all user data. Previously, some parts of the application were using "Users" (uppercase) while others were using "users" (lowercase), which could lead to authentication issues and data inconsistencies.

### Running the Migration

To run the migration script:

1. Make sure you have the necessary Firebase admin credentials set up
2. Navigate to the backend directory
3. Run the script using Node.js:

```bash
cd backend
node scripts/migrateUsers.js
```

### What the Script Does

The script:

1. Reads all documents from the "Users" (uppercase) collection
2. Copies each document to the "users" (lowercase) collection, preserving document IDs
3. Skips documents that already exist in the target collection to prevent duplicates
4. Uses batched writes for better performance and reliability
5. Provides detailed logging of the migration process

### After Migration

After running the migration:

1. Verify that all users can log in successfully
2. Verify that all user data is accessible
3. The original "Users" collection is not deleted automatically - you can delete it manually after verifying everything works correctly

### Troubleshooting

If you encounter any issues during migration:

1. Check the console output for error messages
2. Verify your Firebase credentials and permissions
3. Make sure the Firestore database is accessible
4. For large collections, the script may take some time to complete
