/**
 * Migration Runner Script
 * 
 * This script runs all migrations in sequence to update the database schema
 * and standardize data formats.
 * 
 * Usage: node migrations/run-migrations.js
 */

const { migrateWalletAddresses } = require('./wallet-address-standardization');
const { updateUserSchema } = require('./user-schema-update');

async function runMigrations() {
  console.log('=== Starting Authentico Database Migrations ===');
  console.log('This script will update the database schema and standardize data formats.');
  console.log('Running migrations in sequence...\n');
  
  try {
    // Run wallet address standardization migration
    console.log('\n=== Running Wallet Address Standardization Migration ===');
    await migrateWalletAddresses();
    
    // Run user schema update migration
    console.log('\n=== Running User Schema Update Migration ===');
    await updateUserSchema();
    
    console.log('\n=== All Migrations Completed Successfully ===');
    console.log('The database has been updated to work with the new authentication system.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n=== Migration Failed ===');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
