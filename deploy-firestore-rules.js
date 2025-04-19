// This script deploys the Firestore rules
const { execSync } = require('child_process');

console.log('Deploying Firestore rules...');

try {
  // Deploy Firestore rules
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('Firestore rules deployed successfully!');
} catch (error) {
  console.error('Error deploying Firestore rules:', error);
  process.exit(1);
}
