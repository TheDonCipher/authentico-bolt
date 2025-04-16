/**
 * Generate Master Key Secret Script
 * 
 * This script generates a secure random string to use as the MASTER_KEY_SECRET
 * environment variable for document encryption.
 * 
 * Usage: node scripts/generate-master-key.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random key of specified length
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Main function
function generateMasterKey() {
  try {
    // Generate a 64-byte (128 hex characters) random key
    const masterKeySecret = generateSecureKey(64);
    
    console.log('\n=== MASTER KEY SECRET GENERATOR ===\n');
    console.log('Generated MASTER_KEY_SECRET:');
    console.log(masterKeySecret);
    console.log('\nThis key is used for document encryption in your Authentico application.');
    console.log('Please add it to your environment variables:\n');
    
    // Show how to set the environment variable in different environments
    console.log('For development (.env file):');
    console.log(`MASTER_KEY_SECRET=${masterKeySecret}\n`);
    
    console.log('For Windows PowerShell:');
    console.log(`$env:MASTER_KEY_SECRET="${masterKeySecret}"\n`);
    
    console.log('For Linux/macOS:');
    console.log(`export MASTER_KEY_SECRET="${masterKeySecret}"\n`);
    
    // Check if .env file exists and offer to update it
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Would you like to add this key to your .env file? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          let envContent = fs.readFileSync(envPath, 'utf8');
          
          // Check if MASTER_KEY_SECRET already exists in the file
          if (envContent.includes('MASTER_KEY_SECRET=')) {
            // Replace existing value
            envContent = envContent.replace(
              /MASTER_KEY_SECRET=.*/,
              `MASTER_KEY_SECRET=${masterKeySecret}`
            );
            console.log('Replaced existing MASTER_KEY_SECRET in .env file.');
          } else {
            // Add new entry
            envContent += `\n# Master key for document encryption\nMASTER_KEY_SECRET=${masterKeySecret}\n`;
            console.log('Added MASTER_KEY_SECRET to .env file.');
          }
          
          fs.writeFileSync(envPath, envContent);
        }
        
        readline.close();
      });
    } else {
      // Create a new .env.example file with the master key
      const envExamplePath = path.join(__dirname, '..', '.env.example');
      let envExampleContent = '';
      
      if (fs.existsSync(envExamplePath)) {
        envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
        
        // Check if MASTER_KEY_SECRET already exists in the file
        if (envExampleContent.includes('MASTER_KEY_SECRET=')) {
          // Replace existing value
          envExampleContent = envExampleContent.replace(
            /MASTER_KEY_SECRET=.*/,
            `MASTER_KEY_SECRET=${masterKeySecret}`
          );
        } else {
          // Add new entry
          envExampleContent += `\n# Master key for document encryption\nMASTER_KEY_SECRET=${masterKeySecret}\n`;
        }
      } else {
        // Create new content
        envExampleContent = `# Authentico Environment Variables\n\n# Master key for document encryption\nMASTER_KEY_SECRET=${masterKeySecret}\n`;
      }
      
      fs.writeFileSync(envExamplePath, envExampleContent);
      console.log(`Created/updated .env.example file with the MASTER_KEY_SECRET.`);
      console.log(`Please copy this file to .env for your development environment.`);
    }
    
    console.log('\nIMPORTANT: Keep this key secure and never share it publicly!');
    console.log('If this key is compromised, all encrypted documents could be at risk.');
  } catch (error) {
    console.error('Error generating master key:', error);
  }
}

// Run the generator
generateMasterKey();
