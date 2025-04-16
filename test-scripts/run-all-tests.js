/**
 * Run All Tests Script for Authentico
 *
 * This script seeds test data and runs all the test suites for the Authentico application.
 *
 * Usage: node test-scripts/run-all-tests.js [environment]
 * Example: node test-scripts/run-all-tests.js development
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Get environment from command line argument or default to development
const environment = process.argv[2] || 'development';
console.log(`Running all tests in ${environment} environment`);

// Define test scripts to run
const testScripts = [
  'verify-environment.js',
  'auth-test-suite.js',
  'document-test-suite.js',
  'organization-test-suite.js',
  'e2e-test-suite.js',
];

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  total: testScripts.length + 1, // +1 for seeding script
};

// Function to run a script
function runScript(scriptName, args = []) {
  return new Promise((resolve) => {
    console.log(`\n=== Running ${scriptName} ===\n`);

    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n=== ${scriptName} passed ===\n`);
        results.passed++;
        resolve(true);
      } else {
        console.error(`\n=== ${scriptName} failed with code ${code} ===\n`);
        results.failed++;
        resolve(false); // Resolve with false to indicate failure
      }
    });

    child.on('error', (error) => {
      console.error(
        `\n=== Error running ${scriptName}: ${error.message} ===\n`
      );
      results.failed++;
      resolve(false); // Resolve with false to indicate failure
    });
  });
}

// Load test data from .env.test if it exists
function loadTestData() {
  const testEnvPath = path.join(__dirname, '.env.test');
  if (fs.existsSync(testEnvPath)) {
    console.log(`Loading test data from ${testEnvPath}`);
    const testEnv = dotenv.parse(fs.readFileSync(testEnvPath));

    // Merge test data into process.env
    Object.keys(testEnv).forEach((key) => {
      process.env[key] = testEnv[key];
    });

    console.log('Test data loaded successfully');
    return true;
  }

  console.log('No test data file found');
  return false;
}

// Run all test scripts sequentially
async function runAllTests() {
  console.log('Running All Authentico Tests');
  console.log('===========================');
  console.log(`Environment: ${environment}`);
  console.log('===========================');

  // First, seed test data
  console.log('\n--- Seeding Test Data ---');
  const seedingSuccess = await runScript('seed-test-data.js', [environment]);

  if (seedingSuccess) {
    // Load test data into environment
    loadTestData();

    // Run all test scripts
    for (const script of testScripts) {
      await runScript(script, [environment]);
    }
  } else {
    console.error('\n❌ Seeding test data failed. Skipping tests.');
    results.failed += testScripts.length;
  }

  // Print summary
  console.log('\n===========================');
  console.log('Test Summary:');
  console.log(`Total Scripts: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('===========================');

  // Return non-zero exit code if any scripts failed
  if (results.failed > 0) {
    console.error(
      '\n❌ Some scripts failed. Please check the logs for details.'
    );
    process.exit(1);
  } else {
    console.log('\n✅ All scripts passed!');
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
