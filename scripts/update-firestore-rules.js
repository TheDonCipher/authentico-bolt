/**
 * Script to generate Firestore security rules for Organization Verification feature
 * 
 * This script generates a firestore.rules file that can be deployed using Firebase CLI
 * 
 * Run with: node scripts/update-firestore-rules.js
 * Then deploy with: firebase deploy --only firestore:rules
 */

const fs = require('fs');
const path = require('path');

// Define the security rules
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user is the owner of the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Check if user is an admin
    function isAdmin() {
      return request.auth != null && 
             (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin' ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
    }
    
    // Check if user is a verified organization
    function isVerifiedOrg() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'organization' &&
             (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isVerified == true ||
              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verificationStatus == 'verified');
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Organization applications
    match /organizationApplications/{applicationId} {
      allow read: if isAuthenticated() && 
                  (resource.data.submittedBy == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Verification audit logs
    match /verificationAuditLogs/{logId} {
      allow read: if isAuthenticated() && 
                  (resource.data.organizationId == request.auth.uid || isAdmin());
      allow write: if isAdmin();
    }
    
    // Documents
    match /documents/{documentId} {
      allow read: if isAuthenticated() && 
                  (resource.data.ownerUid == request.auth.uid || 
                   resource.data.verifyingOrgId == request.auth.uid ||
                   resource.data.sharedWith[request.auth.uid] == true ||
                   isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                    (resource.data.ownerUid == request.auth.uid || 
                     (resource.data.verifyingOrgId == request.auth.uid && isVerifiedOrg()) ||
                     isAdmin());
      allow delete: if isAuthenticated() && 
                    (resource.data.ownerUid == request.auth.uid || isAdmin());
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() || isAdmin();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}`;

// Write the rules to a file
const rulesPath = path.join(__dirname, '../firestore.rules');
fs.writeFileSync(rulesPath, rules);

console.log(`Firestore security rules written to: ${rulesPath}`);
console.log('To deploy these rules, run: firebase deploy --only firestore:rules');
