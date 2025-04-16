/**
 * Generate Fixed-Length Master Key Script
 * 
 * This script generates a secure random string of exactly 32 characters
 * to use as the MASTER_KEY_SECRET environment variable for AES-256 encryption.
 * 
 * Usage: node scripts/generate-fixed-master-key.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random key of exactly 32 characters
function generateSecureKey() {
  // Generate 16 random bytes (which will become 32 hex characters)
  return crypto.randomBytes(16).toString('hex');
}

// Update environment files with the new key
function updateEnvFiles(masterKeySecret) {
  const envFiles = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', 'backend', '.env'),
    path.join(__dirname, '..', 'test-scripts', '.env.test')
  ];
  
  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if MASTER_KEY_SECRET already exists in the file
      if (envContent.includes('MASTER_KEY_SECRET=')) {
        // Replace existing value
        envContent = envContent.replace(
          /MASTER_KEY_SECRET=.*/,
          `MASTER_KEY_SECRET=${masterKeySecret}`
        );
        console.log(`Updated MASTER_KEY_SECRET in ${envPath}`);
      } else {
        // Add new entry
        envContent += `\n# Master key for document encryption (exactly 32 characters)\nMASTER_KEY_SECRET=${masterKeySecret}\n`;
        console.log(`Added MASTER_KEY_SECRET to ${envPath}`);
      }
      
      fs.writeFileSync(envPath, envContent);
    }
  }
  
  // Update .env.example file
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Check if MASTER_KEY_SECRET already exists in the file
    if (envExampleContent.includes('MASTER_KEY_SECRET=')) {
      // Replace existing value with a placeholder of the correct length
      envExampleContent = envExampleContent.replace(
        /MASTER_KEY_SECRET=.*/,
        `MASTER_KEY_SECRET=your_32_character_master_key_here`
      );
      console.log(`Updated MASTER_KEY_SECRET placeholder in ${envExamplePath}`);
    }
    
    fs.writeFileSync(envExamplePath, envExampleContent);
  }
}

// Main function
function generateFixedMasterKey() {
  try {
    // Generate a 32-character (16 bytes) random key
    const masterKeySecret = generateSecureKey();
    
    console.log('\n=== FIXED-LENGTH MASTER KEY GENERATOR ===\n');
    console.log('Generated 32-character MASTER_KEY_SECRET:');
    console.log(masterKeySecret);
    console.log(`Length: ${masterKeySecret.length} characters`);
    console.log('\nThis key is used for AES-256 encryption in your Authentico application.');
    
    // Ask if user wants to update env files
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nWould you like to update all environment files with this key? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        updateEnvFiles(masterKeySecret);
        console.log('\nAll environment files have been updated with the new 32-character master key.');
      } else {
        console.log('\nPlease add this key to your environment files manually:');
        console.log('\nFor development (.env file):');
        console.log(`MASTER_KEY_SECRET=${masterKeySecret}\n`);
        
        console.log('For Windows PowerShell:');
        console.log(`$env:MASTER_KEY_SECRET="${masterKeySecret}"\n`);
        
        console.log('For Linux/macOS:');
        console.log(`export MASTER_KEY_SECRET="${masterKeySecret}"\n`);
      }
      
      console.log('\nIMPORTANT: Keep this key secure and never share it publicly!');
      console.log('If this key is compromised, all encrypted documents could be at risk.');
      
      readline.close();
    });
  } catch (error) {
    console.error('Error generating master key:', error);
  }
}

// Run the generator
generateFixedMasterKey();
