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
    if (!status) return 'Pending Verification';

    const lowerStatus = status.toLowerCase();

    // Handle string status values
    if (lowerStatus === 'verified') return 'Verified';
    if (lowerStatus === 'rejected') return 'Rejected';
    if (lowerStatus === 'pending' || lowerStatus === 'pending verification')
      return 'Pending Verification';

    // Handle numeric status codes (old format)
    if (status === '0') return 'Pending Verification';
    if (status === '1') return 'Verified';
    if (status === '2') return 'Rejected';

    // Return a default status if no match
    return 'Pending Verification';
  }
}
