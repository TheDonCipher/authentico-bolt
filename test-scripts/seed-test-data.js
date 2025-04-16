/**
 * Seed Test Data Script for Authentico
 *
 * This script seeds the Firestore database, Pinata, and other data sources
 * with test data for running the test suites.
 *
 * Usage: node test-scripts/seed-test-data.js [environment]
 * Example: node test-scripts/seed-test-data.js development
 */

const { ethers } = require('ethers');
const admin = require('firebase-admin');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables based on command line argument
const environment = process.argv[2] || 'development';
const envFile = `.env.${environment}`;
console.log(`Loading environment from ${envFile}`);
dotenv.config({ path: envFile });

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  testWalletPrivateKey: process.env.TEST_WALLET_PRIVATE_KEY,
  adminWalletPrivateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
  adminWalletAddress: '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c',
  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  pinataJwt: process.env.PINATA_JWT,
  gatewayUrl:
    process.env.GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    'fuchsia-fantastic-python-686.mypinata.cloud',
  masterKeySecret: process.env.MASTER_KEY_SECRET,
};

// Test data
const testData = {
  individual: {
    name: 'Test Individual User',
    email: 'test-individual@example.com',
    userType: 'individual',
  },
  organization: {
    name: 'Test Organization',
    email: 'test-organization@example.com',
    userType: 'organization',
    status: 'verified',
    orgDetails: {
      description: 'This is a test organization for automated testing',
      website: 'https://example.com',
      address: '123 Test Street, Test City, Test Country',
      phoneNumber: '+1234567890',
      industry: 'Technology',
      registrationNumber: 'TEST-REG-12345',
      foundedYear: '2023',
      documentTypes: ['Identity', 'Education', 'Employment'],
    },
  },
  pendingOrganization: {
    name: 'Pending Test Organization',
    email: 'pending-org@example.com',
    userType: 'organization',
    status: 'pending',
    orgDetails: {
      description: 'This is a pending test organization for automated testing',
      website: 'https://pending-example.com',
      address: '456 Pending Street, Test City, Test Country',
      phoneNumber: '+0987654321',
      industry: 'Education',
      registrationNumber: 'PENDING-REG-67890',
      foundedYear: '2022',
      documentTypes: ['Identity', 'Education'],
    },
  },
  documents: [
    {
      name: 'Test Identity Document',
      type: 'Identity',
      status: 'Pending Verification',
    },
    {
      name: 'Test Education Document',
      type: 'Education',
      status: 'Verified',
    },
    {
      name: 'Test Employment Document',
      type: 'Employment',
      status: 'Rejected',
      rejectionReason: 'Test rejection reason',
    },
  ],
};

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  if (
    config.firebaseProjectId &&
    config.firebasePrivateKey &&
    config.firebaseClientEmail
  ) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        privateKey: config.firebasePrivateKey,
        clientEmail: config.firebaseClientEmail,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.log('Firebase credentials not found in environment variables');

    // Try to use service account file if it exists
    try {
      const serviceAccountPath = path.join(
        __dirname,
        '..',
        'firebase-service-account.json'
      );
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized with service account file');
      } else {
        console.log('Firebase service account file not found');
      }
    } catch (error) {
      console.error(
        'Error initializing Firebase with service account file:',
        error
      );
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Initialize wallets
const testWallet = config.testWalletPrivateKey
  ? new ethers.Wallet(config.testWalletPrivateKey)
  : ethers.Wallet.createRandom();

const adminWallet = config.adminWalletPrivateKey
  ? new ethers.Wallet(config.adminWalletPrivateKey)
  : ethers.Wallet.createRandom();

console.log(`Using test wallet address: ${testWallet.address}`);
console.log(`Using admin wallet address: ${adminWallet.address}`);

// Create test documents
function createTestDocument(name, size = 1024 * 10) {
  console.log(`Creating test document: ${name}`);

  const testFilePath = path.join(
    __dirname,
    `${name.replace(/\\s+/g, '-').toLowerCase()}.pdf`
  );

  // Create a PDF-like content
  const header = '%PDF-1.5\n';
  const randomContent = crypto.randomBytes(size).toString('hex');
  const footer = '\n%%EOF';

  const content = header + randomContent + footer;

  fs.writeFileSync(testFilePath, content);
  console.log(
    `Created test document at ${testFilePath} (${content.length} bytes)`
  );

  return {
    path: testFilePath,
    size: content.length,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

// Simulate encryption - in a real scenario, we would encrypt the content
// This function is kept for reference but not used in the current implementation
function simulateEncryption() {
  // Generate a random IV (Initialization Vector)
  const iv = crypto.randomBytes(16).toString('hex');

  // In a real implementation, we would:
  // 1. Create a cipher with the key and IV
  // 2. Encrypt the content
  // 3. Return the encrypted data and IV

  return {
    iv: iv,
    // Other encryption-related data would go here
  };
}

// Seed Firestore with test users
async function seedFirestoreUsers() {
  if (!firebaseApp) {
    console.log(
      'Firebase Admin SDK not initialized, skipping Firestore seeding'
    );
    return false;
  }

  try {
    const db = firebaseApp.firestore();
    const usersCollection = db.collection('users');

    // Check if test users already exist
    const individualSnapshot = await usersCollection
      .where('walletAddress', '==', testWallet.address)
      .get();
    const organizationSnapshot = await usersCollection
      .where('walletAddress', '==', adminWallet.address)
      .get();

    // Create individual user if it doesn't exist
    if (individualSnapshot.empty) {
      const individualData = {
        ...testData.individual,
        walletAddress: testWallet.address,
        uid: `test-individual-${Date.now()}`,
        userType: 'individual',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await usersCollection.doc(individualData.uid).set(individualData);
      console.log(`Created individual user with ID: ${individualData.uid}`);
      testData.individual.uid = individualData.uid;
    } else {
      const individualDoc = individualSnapshot.docs[0];
      console.log(
        `Individual user already exists with ID: ${individualDoc.id}`
      );
      testData.individual.uid = individualDoc.id;
    }

    // Create organization user if it doesn't exist
    if (organizationSnapshot.empty) {
      const organizationData = {
        ...testData.organization,
        walletAddress: adminWallet.address,
        uid: `test-organization-${Date.now()}`,
        userType: 'organization',
        isVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await usersCollection.doc(organizationData.uid).set(organizationData);
      console.log(`Created organization user with ID: ${organizationData.uid}`);
      testData.organization.uid = organizationData.uid;

      // Create organization details
      const orgDetailsCollection = db.collection('organizationDetails');
      await orgDetailsCollection.doc(organizationData.uid).set({
        ...testData.organization.orgDetails,
        orgId: organizationData.uid,
        status: 'verified',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created organization details for: ${organizationData.uid}`);
    } else {
      const organizationDoc = organizationSnapshot.docs[0];
      console.log(
        `Organization user already exists with ID: ${organizationDoc.id}`
      );
      testData.organization.uid = organizationDoc.id;
    }

    // Create pending organization
    const pendingOrgData = {
      ...testData.pendingOrganization,
      walletAddress: ethers.Wallet.createRandom().address,
      uid: `pending-org-${Date.now()}`,
      userType: 'organization',
      isVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection.doc(pendingOrgData.uid).set(pendingOrgData);
    console.log(`Created pending organization with ID: ${pendingOrgData.uid}`);
    testData.pendingOrganization.uid = pendingOrgData.uid;

    // Create organization details for pending org
    const orgDetailsCollection = db.collection('organizationDetails');
    await orgDetailsCollection.doc(pendingOrgData.uid).set({
      ...testData.pendingOrganization.orgDetails,
      orgId: pendingOrgData.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(
      `Created organization details for pending org: ${pendingOrgData.uid}`
    );

    // Create organization application
    const applicationsCollection = db.collection('organizationApplications');
    await applicationsCollection.doc(pendingOrgData.uid).set({
      orgId: pendingOrgData.uid,
      status: 'pending',
      submittedBy: pendingOrgData.uid,
      orgName: testData.pendingOrganization.name,
      contactEmail: testData.pendingOrganization.email,
      ...testData.pendingOrganization.orgDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created organization application for: ${pendingOrgData.uid}`);

    return true;
  } catch (error) {
    console.error('Error seeding Firestore users:', error);
    return false;
  }
}

// Upload document to Pinata
async function uploadToPinata(filePath, fileName) {
  if (!config.pinataJwt) {
    console.log(
      'Pinata JWT not found in environment variables, skipping Pinata upload'
    );
    return {
      success: false,
      mockCid: `mock-ipfs-cid-${Date.now()}`,
    };
  }

  try {
    console.log(`Uploading ${fileName} to Pinata...`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const metadata = JSON.stringify({
      name: fileName,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${config.pinataJwt}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log(`File uploaded to Pinata with CID: ${response.data.IpfsHash}`);
    return {
      success: true,
      cid: response.data.IpfsHash,
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error.message);
    return {
      success: false,
      mockCid: `mock-ipfs-cid-${Date.now()}`,
    };
  }
}

// Seed Firestore with test documents
async function seedFirestoreDocuments() {
  if (!firebaseApp) {
    console.log(
      'Firebase Admin SDK not initialized, skipping document seeding'
    );
    return false;
  }

  try {
    const db = firebaseApp.firestore();
    const documentsCollection = db.collection('documents');

    // Check if we already have test documents
    const existingDocs = await documentsCollection
      .where('uploadedBy', '==', testData.individual.uid)
      .get();

    if (!existingDocs.empty) {
      console.log(
        `Found ${existingDocs.size} existing test documents, skipping document creation`
      );
      return true;
    }

    // Create and upload test documents
    for (const docInfo of testData.documents) {
      // Create test document file
      const testDoc = createTestDocument(docInfo.name);

      // Upload to Pinata
      const pinataResult = await uploadToPinata(testDoc.path, docInfo.name);
      const ipfsCid = pinataResult.success
        ? pinataResult.cid
        : pinataResult.mockCid;

      // Generate encryption key
      const encryptionKey = crypto.randomBytes(32).toString('hex');

      // In a real scenario, we would read and encrypt the file content
      // For testing, we're just simulating the process

      // Create document record
      const documentId = `test-doc-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      const documentData = {
        documentId,
        documentName: docInfo.name,
        documentType: docInfo.type,
        documentTypeName: docInfo.type,
        status: docInfo.status,
        ownerUid: testData.individual.uid,
        ownerName: testData.individual.name,
        verifyingOrgId: testData.organization.uid,
        verifyingOrgName: testData.organization.name,
        encryptedIpfsCid: ipfsCid,
        encryptedDek: encryptionKey,
        originalDocHash: testDoc.hash,
        userWalletAddress: testWallet.address,
        orgWalletAddress: adminWallet.address,
        fileSize: testDoc.size,
        mimeType: 'application/pdf',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (docInfo.status === 'Rejected' && docInfo.rejectionReason) {
        documentData.rejectionReason = docInfo.rejectionReason;
      }

      await documentsCollection.doc(documentId).set(documentData);
      console.log(`Created document record with ID: ${documentId}`);

      // Clean up test file
      fs.unlinkSync(testDoc.path);
    }

    return true;
  } catch (error) {
    console.error('Error seeding Firestore documents:', error);
    return false;
  }
}

// Main function to seed all test data
async function seedAllTestData() {
  console.log('Starting Test Data Seeding');
  console.log('=========================');
  console.log(`Environment: ${environment}`);
  console.log('=========================');

  // Seed Firestore with test users
  console.log('\n--- Seeding Firestore Users ---');
  const usersSeeded = await seedFirestoreUsers();

  // Seed Firestore with test documents
  console.log('\n--- Seeding Firestore Documents ---');
  const documentsSeeded = await seedFirestoreDocuments();

  // Print summary
  console.log('\n=========================');
  console.log('Seeding Results');
  console.log('=========================');
  console.log(`Users Seeded: ${usersSeeded ? 'Success' : 'Failed'}`);
  console.log(`Documents Seeded: ${documentsSeeded ? 'Success' : 'Failed'}`);
  console.log('=========================');

  // Create .env.test file with test data
  const testEnvPath = path.join(__dirname, '.env.test');
  const testEnvContent = `# Test data generated on ${new Date().toISOString()}
TEST_INDIVIDUAL_UID=${testData.individual.uid || ''}
TEST_INDIVIDUAL_WALLET=${testWallet.address}
TEST_INDIVIDUAL_PRIVATE_KEY=${testWallet.privateKey}
TEST_ORGANIZATION_UID=${testData.organization.uid || ''}
TEST_ORGANIZATION_WALLET=${adminWallet.address}
TEST_ORGANIZATION_PRIVATE_KEY=${adminWallet.privateKey}
TEST_PENDING_ORGANIZATION_UID=${testData.pendingOrganization.uid || ''}
TEST_VERIFYING_ORG_ID=${testData.organization.uid || ''}
`;

  fs.writeFileSync(testEnvPath, testEnvContent);
  console.log(`\nTest data saved to ${testEnvPath}`);

  // Clean up Firebase Admin SDK
  if (firebaseApp) {
    await firebaseApp.delete();
    console.log('Firebase Admin SDK cleaned up');
  }
}

// Run the seeding function
seedAllTestData().catch((error) => {
  console.error('Error seeding test data:', error);
  process.exit(1);
});
