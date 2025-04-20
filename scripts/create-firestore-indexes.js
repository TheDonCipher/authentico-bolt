/**
 * Script to create required Firestore indexes for Organization Verification feature
 *
 * This script generates a firestore.indexes.json file that can be deployed using Firebase CLI
 *
 * Run with: node scripts/create-firestore-indexes.js
 * Then deploy with: firebase deploy --only firestore:indexes
 */

const fs = require('fs');
const path = require('path');

// Define the required indexes
const indexes = {
  indexes: [
    {
      collectionGroup: 'organizationApplications',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'submittedBy',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'submittedAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'organizationApplications',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'status',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'submittedAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'verificationAuditLogs',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'organizationId',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'updatedAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'users',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'userType',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'verificationStatus',
          order: 'ASCENDING',
        },
      ],
    },
    {
      collectionGroup: 'users',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'userType',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'isVerified',
          order: 'ASCENDING',
        },
      ],
    },
    {
      collectionGroup: 'documents',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'verifyingOrgId',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'createdAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'verificationRequests',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'verifyingOrgId',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'createdAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'notifications',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'userId',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'read',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'createdAt',
          order: 'DESCENDING',
        },
      ],
    },
    {
      collectionGroup: 'notifications',
      queryScope: 'COLLECTION',
      fields: [
        {
          fieldPath: 'userId',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'type',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'read',
          order: 'ASCENDING',
        },
        {
          fieldPath: 'createdAt',
          order: 'DESCENDING',
        },
      ],
    },
  ],
  fieldOverrides: [],
};

// Write the indexes to a file
const indexesPath = path.join(__dirname, '../firestore.indexes.json');
fs.writeFileSync(indexesPath, JSON.stringify(indexes, null, 2));

console.log(`Firestore indexes configuration written to: ${indexesPath}`);
console.log(
  'To deploy these indexes, run: firebase deploy --only firestore:indexes'
);
