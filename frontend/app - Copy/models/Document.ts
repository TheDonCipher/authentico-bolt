export class Document {
  constructor(
    public documentId: number,
    public urlPicture: string,
    public publicAddress: string,
    public metadataHash: string,
    public status: string,
    public documentType: string,
    public verifier: string,

  ) { }
}
