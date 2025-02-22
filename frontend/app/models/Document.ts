export class Document {
  constructor(
    public id: number,
    public name: string,
    public status: string,
    public similarity: number,
    public verifyingOrg: string,
    public rejectionReason: string
  ) {}
}
