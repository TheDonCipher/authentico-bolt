import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("DocumentNFT", function () {
    async function deployDocumentNFTFixture() {
        const [owner, verifier, user, user2] = await hre.ethers.getSigners();

        const DocumentNFT = await hre.ethers.getContractFactory("DocumentNFT");
        const documentNFT = await DocumentNFT.deploy();

        return { documentNFT, owner, verifier, user, user2 };
    }

    describe("Deployment", function () {
        it("Should set the correct verifier", async function () {
            const { documentNFT, owner } = await loadFixture(deployDocumentNFTFixture);

            expect(await documentNFT.verifier()).to.equal(owner.address);
        });

        it("Should have the correct token name and symbol", async function () {
            const { documentNFT } = await loadFixture(deployDocumentNFTFixture);

            expect(await documentNFT.name()).to.equal("DocumentNFT");
            expect(await documentNFT.symbol()).to.equal("DOCNFT");
        });
    });

    describe("Minting", function () {
        it("Should allow the owner to mint a new NFT", async function () {
            const { documentNFT, owner, user } = await loadFixture(deployDocumentNFTFixture);

            await expect(
                documentNFT.mintDocumentNFT(
                    user.address,
                    "http://example.com/document",
                    "John Doe",
                    "123456789",
                    "metadataHash"
                )
            )
                .to.emit(documentNFT, "DocumentVerified")
                .withArgs(0, user.address, "http://example.com/document", "John Doe", 0);

            const document = await documentNFT.getDocumentDetails(0);
            expect(document.holderName).to.equal("John Doe");
            expect(document.status).to.equal(0); // New status
        });

        it("Should revert if a non-owner tries to mint", async function () {
            const { documentNFT, user, user2 } = await loadFixture(deployDocumentNFTFixture);
            console.log("user2.address", user2.address)
            console.log("user.address", user.address)

            await expect(
                documentNFT.connect(user2).mintDocumentNFT(
                    user2.address,
                    "http://example.com/document",
                    "John Doe",
                    "123456789",
                    "metadataHash"
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Verification", function () {
        it("Should allow the verifier to verify a document", async function () {
            const { documentNFT, owner, user } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.mintDocumentNFT(
                user.address,
                "http://example.com/document",
                "John Doe",
                "123456789",
                "metadataHash"
            );

            await expect(documentNFT.verifyDocument(0))
                .to.emit(documentNFT, "DocumentVerified")
                .withArgs(0, user.address, "http://example.com/document", "John Doe", 1);

            const document = await documentNFT.getDocumentDetails(0);
            expect(document.status).to.equal(1); // Verified status
        });

        it("Should revert if a non-verifier tries to verify", async function () {
            const { documentNFT, user } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.mintDocumentNFT(
                user.address,
                "http://example.com/document",
                "John Doe",
                "123456789",
                "metadataHash"
            );

            await expect(
                documentNFT.connect(user).verifyDocument(0)
            ).to.be.revertedWith("DocumentNFT: Caller is not the verifier");
        });

        it("Should revert if the document is already verified", async function () {
            const { documentNFT, owner, user } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.mintDocumentNFT(
                user.address,
                "http://example.com/document",
                "John Doe",
                "123456789",
                "metadataHash"
            );

            await documentNFT.verifyDocument(0);

            await expect(documentNFT.verifyDocument(0)).to.be.revertedWith(
                "DocumentNFT: Document is already verified or rejected"
            );
        });
    });

    describe("Ownership and Permissions", function () {
        it("Should allow the owner to set a new verifier", async function () {
            const { documentNFT, owner, verifier } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.setVerifier(verifier.address);
            expect(await documentNFT.verifier()).to.equal(verifier.address);
        });

        it("Should revert if a non-owner tries to set a new verifier", async function () {
            const { documentNFT, user } = await loadFixture(deployDocumentNFTFixture);

            await expect(
                documentNFT.connect(user).setVerifier(user.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Document Status Changes", function () {
        it("Should allow the owner to change document status", async function () {
            const { documentNFT, owner, user } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.mintDocumentNFT(
                user.address,
                "http://example.com/document",
                "John Doe",
                "123456789",
                "metadataHash"
            );

            await documentNFT.changeStatus(0, 2); // Rejected status

            const document = await documentNFT.getDocumentDetails(0);
            expect(document.status).to.equal(2);
        });

        it("Should revert if a non-owner tries to change document status", async function () {
            const { documentNFT, user } = await loadFixture(deployDocumentNFTFixture);

            await documentNFT.mintDocumentNFT(
                user.address,
                "http://example.com/document",
                "John Doe",
                "123456789",
                "metadataHash"
            );

            await expect(
                documentNFT.connect(user).changeStatus(0, 2)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
