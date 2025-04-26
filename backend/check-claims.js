const { admin } = require('./config');

async function checkUserClaims() {
  try {
    const uid = 'rzlziOWi5RZtfCTF83QrEgFO3ZL2';
    const user = await admin.auth().getUser(uid);
    console.log('User record:', user);
    console.log('Custom claims:', user.customClaims);
    
    // Set custom claims if needed
    await admin.auth().setCustomUserClaims(uid, {
      userType: 'organization',
      isVerified: true,
      verificationStatus: 'verified',
      walletAddress: '0xceFef8902028683DEa908D6F35d772fFAE01Fc0e'
    });
    
    console.log('Custom claims updated');
    
    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(uid);
    console.log('Updated custom claims:', updatedUser.customClaims);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUserClaims();
