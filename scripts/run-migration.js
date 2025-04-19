/**
 * Script to run all migration steps for Organization Verification feature
 * 
 * This script:
 * 1. Creates Firestore indexes configuration
 * 2. Updates Firestore security rules
 * 3. Runs the data migration
 * 
 * Run with: node scripts/run-migration.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('=== Organization Verification Migration ===');

try {
  // Step 1: Create Firestore indexes configuration
  console.log('\n1. Creating Firestore indexes configuration...');
  execSync('node scripts/create-firestore-indexes.js', { stdio: 'inherit' });
  
  // Step 2: Update Firestore security rules
  console.log('\n2. Updating Firestore security rules...');
  execSync('node scripts/update-firestore-rules.js', { stdio: 'inherit' });
  
  // Step 3: Run data migration
  console.log('\n3. Running data migration...');
  execSync('node scripts/migrate-organization-verification.js', { stdio: 'inherit' });
  
  console.log('\n=== Migration completed successfully! ===');
  console.log('\nNext steps:');
  console.log('1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
  console.log('2. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('3. Test the Organization Verification feature');
  
} catch (error) {
  console.error('\n=== Migration failed! ===');
  console.error(error.message);
  process.exit(1);
}
