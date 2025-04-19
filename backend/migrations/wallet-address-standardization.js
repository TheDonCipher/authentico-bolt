const { adminDb, USER_COLLECTION, admin } = require('../config');

/**
 * Standardizes wallet addresses to lowercase format
 * This ensures consistent wallet address format across the application
 */
async function migrateWalletAddresses() {
  console.log('Starting wallet address standardization migration...');

  try {
    const usersRef = adminDb.collection(USER_COLLECTION);
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('No user documents found. Nothing to migrate.');
      return;
    }

    console.log(`Found ${snapshot.size} user documents to process.`);

    const batch = adminDb.batch();
    let updatedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Check if document has a wallet address
      if (data.walletAddress) {
        const currentAddress = data.walletAddress;
        const standardizedAddress = currentAddress.toLowerCase();

        // Only update if the address actually needs to be changed
        if (currentAddress !== standardizedAddress) {
          batch.update(doc.ref, {
            walletAddress: standardizedAddress,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(
        `Successfully standardized ${updatedCount} wallet addresses.`
      );
    } else {
      console.log('No wallet addresses needed standardization.');
    }

    console.log(
      'Wallet address standardization migration completed successfully.'
    );
  } catch (error) {
    console.error('Error during wallet address standardization:', error);
    throw error;
  }
}

module.exports = { migrateWalletAddresses };
