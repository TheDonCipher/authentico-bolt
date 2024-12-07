const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentNFT", function () {
  let DocumentNFT, documentNFT;
    let owner, verifier, user1, user2;
    console.log(
        `--document owner : ${await documentNFT.owner()}-- and owner ${
          owner.address
        }---end`
      );

  beforeEach(async () => {
    [owner, verifier, user1, user2] = await ethers.getSigners();

    // Deploy the DocumentNFT contract
    DocumentNFT = await ethers.getContractFactory("DocumentNFT");
    documentNFT = await DocumentNFT.deploy(verifier.address);
    await documentNFT.deployed();
  });

  describe("Deployment", () => {
    it("Should set the correct owner", async () => {
      
      expect(await documentNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct verifier", async () => {
      expect(await documentNFT.verifier()).to.equal(verifier.address);
    });
  });

  describe("Minting Document NFTs", () => {
    it("Should allow the owner to mint a new DocumentNFT", async () => {
      const tx = await documentNFT
        .connect(owner)
        .mintDocumentNFT(user1.address, "http://example.com/doc1", "QmHash1");
      await tx.wait();

      expect(await documentNFT.ownerOf(1)).to.equal(user1.address);

      const document = await documentNFT.viewDocument(1);
      expect(document[0]).to.equal("http://example.com/doc1");
      expect(document[1]).to.equal("QmHash1");
      expect(document[2]).to.be.false; // Not verified yet
    });

    it("Should not allow non-owners to mint DocumentNFTs", async () => {
      await expect(
        documentNFT
          .connect(user1)
          .mintDocumentNFT(user1.address, "http://example.com/doc2", "QmHash2")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Verification of Documents", () => {
    beforeEach(async () => {
      // Mint a DocumentNFT for testing
      await documentNFT
        .connect(owner)
        .mintDocumentNFT(user1.address, "http://example.com/doc1", "QmHash1");
    });

    it("Should allow the verifier to verify a document", async () => {
      const tx = await documentNFT.connect(verifier).verifyDocument(1);
      await tx.wait();

      const document = await documentNFT.viewDocument(1);
      expect(document[2]).to.be.true; // Verified
    });

    it("Should not allow non-verifiers to verify documents", async () => {
      await expect(
        documentNFT.connect(user1).verifyDocument(1)
      ).to.be.revertedWith(
        "DocumentNFT: Only the authorized verifier can verify"
      );
    });

    it("Should not allow verification of a non-existent document", async () => {
      await expect(
        documentNFT.connect(verifier).verifyDocument(99)
      ).to.be.revertedWith("DocumentNFT: Document does not exist");
    });

    it("Should not allow re-verification of an already verified document", async () => {
      await documentNFT.connect(verifier).verifyDocument(1);

      await expect(
        documentNFT.connect(verifier).verifyDocument(1)
      ).to.be.revertedWith("DocumentNFT: Document is already verified");
    });
  });

  describe("Viewing Documents", () => {
    beforeEach(async () => {
      // Mint a DocumentNFT for testing
      await documentNFT
        .connect(owner)
        .mintDocumentNFT(user1.address, "http://example.com/doc1", "QmHash1");
    });

    it("Should allow anyone to view document details", async () => {
      const document = await documentNFT.viewDocument(1);
      expect(document[0]).to.equal("http://example.com/doc1");
      expect(document[1]).to.equal("QmHash1");
      expect(document[2]).to.be.false; // Not verified
    });

    it("Should revert if trying to view a non-existent document", async () => {
      await expect(documentNFT.viewDocument(99)).to.be.revertedWith(
        "DocumentNFT: Document does not exist"
      );
    });

    it("Should allow retrieval of the full Document struct", async () => {
      const document = await documentNFT.getDocumentDetails(1);
      expect(document.url).to.equal("http://example.com/doc1");
      expect(document.metadataHash).to.equal("QmHash1");
      expect(document.isVerified).to.be.false; // Not verified
    });
  });

  describe("Setting a New Verifier", () => {
    it("Should allow the owner to set a new verifier", async () => {
      const tx = await documentNFT.connect(owner).setVerifier(user2.address);
      await tx.wait();

      expect(await documentNFT.verifier()).to.equal(user2.address);
    });

    it("Should not allow non-owners to set a new verifier", async () => {
      await expect(
        documentNFT.connect(user1).setVerifier(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
