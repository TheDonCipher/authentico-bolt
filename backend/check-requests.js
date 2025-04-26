const { admin, adminDb } = require('./config');

async function checkVerificationRequests() {
  try {
    const requestsSnapshot = await adminDb.collection('verificationRequests').get();
    console.log(`Found ${requestsSnapshot.size} verification requests`);
    
    if (!requestsSnapshot.empty) {
      requestsSnapshot.docs.forEach(doc => {
        console.log('Request ID:', doc.id);
        console.log('Request data:', doc.data());
        console.log('-------------------');
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkVerificationRequests();
