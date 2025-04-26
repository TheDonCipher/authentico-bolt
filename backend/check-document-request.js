const { admin, adminDb } = require('./config');

async function checkDocumentRequest() {
  try {
    const documentId = 'kLlJF7zUcZ4A69UrTWBm';
    
    // Get document
    const docSnapshot = await adminDb.collection('documents').doc(documentId).get();
    if (docSnapshot.exists) {
      console.log('Document data:', docSnapshot.data());
    } else {
      console.log('Document not found');
    }
    
    // Get verification request
    const requestsSnapshot = await adminDb
      .collection('verificationRequests')
      .where('documentId', '==', documentId)
      .get();
      
    if (!requestsSnapshot.empty) {
      console.log('Verification request:', requestsSnapshot.docs[0].data());
      console.log('Request ID:', requestsSnapshot.docs[0].id);
      
      // Update verification request status if needed
      const requestId = requestsSnapshot.docs[0].id;
      await adminDb.collection('verificationRequests').doc(requestId).update({
        status: 'verified',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Verification request updated');
    } else {
      console.log('No verification request found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDocumentRequest();
