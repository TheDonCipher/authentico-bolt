export class Document {
  constructor(
    public documentId: string | number,
    public urlPicture: string = '',
    public publicAddress: string = '',
    public metadataHash: string = '',
    public status: string = 'Pending',
    public documentType: string = '',
    public verifier: string = '', // For backward compatibility
    public documentName: string = '',
    public transactionHash?: string,
    public blockNumber?: number,
    public tokenId?: number,
    public createdAt?: string,
    public updatedAt?: string,
    public ownerUid?: string,
    public verifyingOrgId?: string,
    public sharedWith?: Record<string, boolean>,
    public rejectionReason?: string // Reason for rejection if status is 'Rejected'
  ) {
    // Ensure verifier and verifyingOrgId are in sync
    if (verifyingOrgId && !verifier) {
      this.verifier = verifyingOrgId;
    } else if (verifier && !verifyingOrgId) {
      this.verifyingOrgId = verifier;
    }

    // Normalize status to handle different formats
    this.status = this.normalizeStatus(status);
  }

  // Helper method to normalize status values
  private normalizeStatus(status: string): string {
    if (!status) return 'Pending';

    const lowerStatus = status.toLowerCase();

    if (lowerStatus === 'verified') return 'Verified';
    if (lowerStatus === 'rejected') return 'Rejected';
    if (lowerStatus === 'pending' || lowerStatus === 'pending verification')
      return 'Pending Verification';

    // If it's a numeric status (old format), convert it
    if (lowerStatus === '1') return 'Pending';
    if (lowerStatus === '2') return 'Verified';
    if (lowerStatus === '3') return 'Rejected';

    // Return the original status if no match
    return status;
  }
}
