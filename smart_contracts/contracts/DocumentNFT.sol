// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// @author: @BornToCode265
// email: born2code265@gmail.com
// Created on 2021-09-30 12:00:00

// Importing OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DocumentNFT
 * @dev A contract for minting and verifying document NFTs.
 */
contract DocumentNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _tokenIds;
    address public verifier; // Authorized verifier address

    // Mapping token ID to document metadata and verification status
    enum VerificationStatus {
        New,
        Verified,
        Rejected
    }

    struct Document {
        string urlPicture;
        string holderName;
        string nationalID;
        string metadataHash;
        VerificationStatus status;
    }

    mapping(uint256 => Document) private documents;

    // Event to emit when a document is verified
    event DocumentVerified(
        uint256 indexed tokenId,
        address indexed owner,
        string urlPicture,
        string holderName,
        VerificationStatus indexed status
    );

    constructor() ERC721("DocumentNFT", "DOCNFT") Ownable(msg.sender) {
        verifier = msg.sender;
    }

    function setVerifier(address _newVerifier) external onlyOwner {
        require(
            _newVerifier != address(0),
            "DocumentNFT: Invalid verifier address"
        );
        require(_newVerifier != verifier, "DocumentNFT: Verifier is the same");
        verifier = _newVerifier;
    }

    function mintDocumentNFT(
        address to,
        string memory _documentUrl,
        string memory _holderName,
        string memory _nationalID,
        string memory _metadataHash
    ) external onlyOwner nonReentrant {
        uint256 tokenId = _tokenIds++;
        _safeMint(to, tokenId);

        documents[tokenId] = Document({
            urlPicture: _documentUrl,
            holderName: _holderName,
            nationalID: _nationalID,
            metadataHash: _metadataHash,
            status: VerificationStatus.New
        });

        emit DocumentVerified(
            tokenId,
            to,
            _documentUrl,
            _holderName,
            VerificationStatus.New
        );
    }

    /**
     * @dev Verify the document (mark as verified) for a given token ID.
     * Can only be called by the authorized verifier.
     * @param tokenId The ID of the token representing the document.
     */
    function verifyDocument(uint256 tokenId) external {
        require(
            msg.sender == verifier,
            "DocumentNFT: Caller is not the verifier"
        );

        require(
            documents[tokenId].status == VerificationStatus.New,
            "DocumentNFT: Document is already verified or rejected"
        );

        documents[tokenId].status = VerificationStatus.Verified;

        emit DocumentVerified(
            tokenId,
            ownerOf(tokenId),
            documents[tokenId].urlPicture,
            documents[tokenId].holderName,
            VerificationStatus.Verified
        );
    }

    /**
     * @dev Retrieve the document details for a given token ID.
     * @param tokenId The ID of the token representing the document.
     * @return document The Document struct with URL, metadata hash, and verification status.
     */
    function getDocumentDetails(
        uint256 tokenId
    ) external view returns (Document memory) {
        return documents[tokenId];
    }

    /**
     * @dev Change the status of a document.
     * @param tokenId The ID of the token representing the document.
     * @param status The new status of the document.
     */
    function changeStatus(
        uint256 tokenId,
        VerificationStatus status
    ) external onlyOwner nonReentrant {
        documents[tokenId].status = status;

        emit DocumentVerified(
            tokenId,
            ownerOf(tokenId),
            documents[tokenId].urlPicture,
            documents[tokenId].holderName,
            status
        );
    }
}
