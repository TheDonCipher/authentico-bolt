// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DocumentNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    address public verifier; // Authorized verifier address

    // Mapping token ID to document metadata (URL and IPFS hash) and verification status
    struct Document {
        string url;
        string metadataHash;
        bool isVerified;
    }

    mapping(uint256 => Document) private documents;

    // Event to emit when a document is verified
    event DocumentVerified(uint256 tokenId);

    constructor(address _verifier) ERC721("DocumentNFT", "DOCNFT") {
        verifier = _verifier;
    }

    /**
     * @dev Set a new verifier address.
     * @param newVerifier The address of the new verifier.
     */
    function setVerifier(address newVerifier) external onlyOwner {
        verifier = newVerifier;
    }

    /**
     * @dev Mint a new document NFT.
     * @param to The address of the recipient.
     * @param documentUrl The URL of the document.
     * @param metadataHash The IPFS hash of the document's metadata.
     * @return tokenId The ID of the minted NFT.
     */
    function mintDocumentNFT(
        address to,
        string memory documentUrl,
        string memory metadataHash
    ) public onlyOwner returns (uint256) {
        _tokenIds += 1;
        uint256 tokenId = _tokenIds;

        _safeMint(to, tokenId);

        // Store document data with default verification status as false
        documents[tokenId] = Document(documentUrl, metadataHash, false);

        return tokenId;
    }

    /**
     * @dev Verify the document (mark as verified) for a given token ID.
     * Can only be called by the authorized verifier.
     * @param tokenId The ID of the token representing the document.
     */
    function verifyDocument(uint256 tokenId) public {
        require(
            msg.sender == verifier,
            "DocumentNFT: Only the authorized verifier can verify"
        );
        require(_exists(tokenId), "DocumentNFT: Document does not exist");
        require(
            !documents[tokenId].isVerified,
            "DocumentNFT: Document is already verified"
        );

        // Mark the document as verified
        documents[tokenId].isVerified = true;

        emit DocumentVerified(tokenId);
    }

    /**
     * @dev Retrieve the document details (URL, metadata hash, and verification status) for a given token ID.
     * @param tokenId The ID of the token representing the document.
     * @return documentUrl The URL of the document.
     * @return metadataHash The IPFS hash of the document's metadata.
     * @return isVerified The verification status of the document.
     */
    function viewDocument(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory documentUrl,
            string memory metadataHash,
            bool isVerified
        )
    {
        require(_exists(tokenId), "DocumentNFT: Document does not exist");
        Document memory document = documents[tokenId];
        return (document.url, document.metadataHash, document.isVerified);
    }

    /**
     * @dev Retrieve the entire Document struct for a given token ID.
     * @param tokenId The ID of the token representing the document.
     * @return document A Document struct with URL, metadata hash, and verification status.
     */
    function getDocumentDetails(
        uint256 tokenId
    ) public view returns (Document memory document) {
        require(_exists(tokenId), "DocumentNFT: Document does not exist");
        return documents[tokenId];
    }
}
