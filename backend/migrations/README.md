# Database Migrations

This directory contains migration scripts to update the database schema and standardize data formats for the Authentico platform.

## Available Migrations

1. **Wallet Address Standardization** (`wallet-address-standardization.js`)
   - Standardizes wallet addresses to lowercase format
   - Ensures consistent wallet address format across the application

2. **User Schema Update** (`user-schema-update.js`)
   - Updates user documents to ensure all required fields are present
   - Based on the User interface from frontend/app/types/user.ts
   - Adds timestamps for tracking document updates

## Running Migrations

You can run all migrations at once using the migration runner script:

```bash
# From the backend directory
npm run migrate
```

Or run individual migrations directly:

```bash
# From the backend directory
node migrations/wallet-address-standardization.js
node migrations/user-schema-update.js
```

## Migration Process

The migration process:

1. Connects to the Firestore database using admin credentials
2. Retrieves all documents from the users collection
3. Processes each document to apply the necessary updates
4. Uses batch operations for better performance and reliability
5. Provides detailed logging of the migration process

## Adding New Migrations

To add a new migration:

1. Create a new JavaScript file in the migrations directory
2. Export a function that performs the migration
3. Add the migration to the `run-migrations.js` script

Example structure for a new migration:

```javascript
const { adminDb, USER_COLLECTION, admin } = require('../config');

async function myNewMigration() {
  console.log('Starting my new migration...');
  
  try {
    // Migration logic here
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

module.exports = { myNewMigration };
```

## After Running Migrations

After running migrations:

1. Verify that all users can log in successfully
2. Verify that all user data is accessible
3. Check that wallet addresses are properly standardized
4. Ensure all user documents have the required fields
