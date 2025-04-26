/**
 * Script to fix dependency conflicts for deployment
 * 
 * This script ensures that dependency conflicts are resolved by adding
 * necessary configuration files and flags for npm.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing dependency conflicts for deployment...');

// Define paths for .npmrc files
const npmrcPaths = [
  path.join(__dirname, '..', '.npmrc'),
  path.join(__dirname, '..', 'frontend', '.npmrc'),
  path.join(__dirname, '..', 'backend', '.npmrc'),
  path.join(__dirname, '..', 'minimal-hardhat', '.npmrc')
];

// Define content for .npmrc files
const npmrcContent = `# Enforce consistent dependency resolution
legacy-peer-deps=true
resolution-mode=highest
`;

// Create or update .npmrc files
npmrcPaths.forEach(npmrcPath => {
  const dirPath = path.dirname(npmrcPath);
  
  // Check if directory exists
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist, skipping...`);
    return;
  }
  
  // Create or update .npmrc file
  try {
    fs.writeFileSync(npmrcPath, npmrcContent);
    console.log(`Created/updated .npmrc file at ${npmrcPath}`);
  } catch (error) {
    console.error(`Error creating .npmrc file at ${npmrcPath}:`, error);
  }
});

// Update render.yaml if it exists
const renderYamlPath = path.join(__dirname, '..', 'backend', 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  try {
    let renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
    
    // Update buildCommand to use --legacy-peer-deps
    renderYaml = renderYaml.replace(
      /buildCommand: npm install/g,
      'buildCommand: npm install --legacy-peer-deps'
    );
    
    fs.writeFileSync(renderYamlPath, renderYaml);
    console.log('Updated buildCommand in render.yaml to use --legacy-peer-deps');
  } catch (error) {
    console.error('Error updating render.yaml:', error);
  }
}

console.log('Dependency conflict fixes completed.');
