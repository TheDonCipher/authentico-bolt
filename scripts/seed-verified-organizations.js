/**
 * Seed Verified Organizations Script for Authentico
 *
 * This script seeds the Firestore database with verified organizations
 * that can be used for document verification in the demo environment.
 *
 * Usage: node scripts/seed-verified-organizations.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  // Try to use service account file if it exists
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
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    // Use environment variables
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin SDK initialized with environment variables');
  } else {
    // Try to use default application credentials (Firebase CLI)
    console.log('Attempting to use Firebase CLI credentials...');

    // Check if Firebase CLI config exists
    const homeDir = require('os').homedir();
    const firebaseConfigPath = path.join(
      homeDir,
      '.config',
      'firebase',
      'config.json'
    );

    if (fs.existsSync(firebaseConfigPath)) {
      try {
        const firebaseConfig = JSON.parse(
          fs.readFileSync(firebaseConfigPath, 'utf8')
        );
        const activeProject = firebaseConfig.activeProjects?.default;

        if (activeProject) {
          console.log(`Found active Firebase project: ${activeProject}`);

          // Initialize with application default credentials
          firebaseApp = admin.initializeApp({
            projectId: activeProject,
          });

          console.log(
            'Firebase Admin SDK initialized with Firebase CLI credentials'
          );
        } else {
          throw new Error(
            'No active Firebase project found in Firebase CLI config'
          );
        }
      } catch (configError) {
        console.error('Error reading Firebase CLI config:', configError);
        throw new Error('Could not use Firebase CLI credentials');
      }
    } else {
      console.error(
        'Firebase credentials not found. Please set environment variables or provide a service account file.'
      );
      console.log(
        '\nTo set up Firebase credentials, run: npm run setup:firebase-env'
      );
      console.log(
        'Or follow the instructions in FIREBASE_CREDENTIALS_GUIDE.md'
      );
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log(
    '\nTo set up Firebase credentials, run: npm run setup:firebase-env'
  );
  console.log('Or follow the instructions in FIREBASE_CREDENTIALS_GUIDE.md');
  process.exit(1);
}

// Sample verified organizations data
const verifiedOrganizations = [
  {
    name: 'National Identity Authority',
    email: 'contact@nationalid.example.com',
    website: 'https://nationalid.example.com',
    description:
      'Official government authority for identity verification and document issuance.',
    industry: 'Government',
    phoneNumber: '+1-555-123-4567',
    address: '1000 Government Plaza, Capital City',
    registrationNumber: 'GOV-ID-12345',
    foundedYear: '1950',
    documentTypes: ['identity', 'passport', 'national_id', 'driver_license'],
    verificationBadge: true,
  },
  {
    name: 'Global Education Verification',
    email: 'verify@globaledu.example.com',
    website: 'https://globaledu.example.com',
    description:
      'International organization specializing in verification of educational credentials and certificates.',
    industry: 'Education',
    phoneNumber: '+1-555-987-6543',
    address: '200 Academic Avenue, Knowledge City',
    registrationNumber: 'EDU-VER-54321',
    foundedYear: '1985',
    documentTypes: ['education', 'diploma', 'degree', 'transcript'],
    verificationBadge: true,
  },
  {
    name: 'Corporate Employment Verification',
    email: 'hr@corpverify.example.com',
    website: 'https://corpverify.example.com',
    description:
      'Trusted third-party employment verification service for corporations and businesses.',
    industry: 'Human Resources',
    phoneNumber: '+1-555-456-7890',
    address: '300 Business Boulevard, Enterprise City',
    registrationNumber: 'EMP-VER-67890',
    foundedYear: '2005',
    documentTypes: ['employment', 'contract', 'offer_letter', 'recommendation'],
    verificationBadge: true,
  },
  {
    name: 'Financial Document Authority',
    email: 'verify@findoc.example.com',
    website: 'https://findoc.example.com',
    description:
      'Specialized in verification of financial documents, statements, and credentials.',
    industry: 'Financial Services',
    phoneNumber: '+1-555-789-0123',
    address: '400 Finance Street, Money City',
    registrationNumber: 'FIN-DOC-09876',
    foundedYear: '1998',
    documentTypes: [
      'financial',
      'bank_statement',
      'tax_return',
      'credit_report',
    ],
    verificationBadge: true,
  },
  {
    name: 'Legal Document Verification',
    email: 'legal@docverify.example.com',
    website: 'https://legaldocverify.example.com',
    description:
      'Professional verification service for legal documents and certificates.',
    industry: 'Legal Services',
    phoneNumber: '+1-555-321-6547',
    address: '500 Justice Road, Law City',
    registrationNumber: 'LEG-VER-13579',
    foundedYear: '2001',
    documentTypes: ['legal', 'contract', 'certificate', 'court_document'],
    verificationBadge: true,
  },
];

// Seed verified organizations
async function seedVerifiedOrganizations() {
  try {
    const db = firebaseApp.firestore();
    const usersCollection = db.collection('users');
    const orgDetailsCollection = db.collection('organizationDetails');

    console.log('Starting to seed verified organizations...');

    // Check if we already have verified organizations
    const existingOrgsSnapshot = await usersCollection
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    if (!existingOrgsSnapshot.empty) {
      console.log(
        `Found ${existingOrgsSnapshot.size} existing verified organizations.`
      );

      // Ask if user wants to proceed
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        readline.question(
          'Do you want to add more verified organizations? (y/n): ',
          resolve
        );
      });

      readline.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Exiting without adding more organizations.');
        return;
      }
    }

    // Add each organization
    for (const org of verifiedOrganizations) {
      // Check if organization with this name already exists
      const existingOrgSnapshot = await usersCollection
        .where('name', '==', org.name)
        .where('userType', '==', 'organization')
        .get();

      if (!existingOrgSnapshot.empty) {
        console.log(`Organization "${org.name}" already exists. Skipping.`);
        continue;
      }

      // Generate a unique ID for the organization
      const orgId = uuidv4();

      // Create a random wallet address for the organization
      const walletAddress =
        '0x' +
        [...Array(40)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('');

      // Create the organization document
      await usersCollection.doc(orgId).set({
        uid: orgId,
        name: org.name,
        email: org.email,
        walletAddress: walletAddress,
        userType: 'organization',
        isVerified: true,
        website: org.website,
        description: org.description,
        industry: org.industry,
        phoneNumber: org.phoneNumber,
        documentTypes: org.documentTypes,
        verificationBadge: org.verificationBadge,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create organization details document
      await orgDetailsCollection.doc(orgId).set({
        orgId: orgId,
        name: org.name,
        website: org.website,
        description: org.description,
        address: org.address,
        phoneNumber: org.phoneNumber,
        industry: org.industry,
        registrationNumber: org.registrationNumber,
        foundedYear: org.foundedYear,
        documentTypes: org.documentTypes,
        status: 'verified',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Created verified organization: ${org.name} (${orgId})`);
    }

    console.log('Successfully seeded verified organizations!');
  } catch (error) {
    console.error('Error seeding verified organizations:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the seeding function
seedVerifiedOrganizations();
