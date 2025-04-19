export class Document {
  constructor(
    public documentId: string | number,
    public urlPicture: string,
    public publicAddress: string,
    public metadataHash: string,
    public status: string,
    public documentType: string,
    public verifier: string,
    public documentName: string = '',
    public transactionHash?: string,
    public blockNumber?: number,
    public tokenId?: number,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}
