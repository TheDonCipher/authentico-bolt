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
 * @title Authentico NFT contract
 * @dev A contract for minting and verifying document NFTs.
 */
contract DocumentNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _tokenIds;
    address public verifier; // Authorized verifier address

    // Mapping token ID to document metadata and verification status
    enum Status {
        New,
        Verified,
        Rejected
    }

    struct Document {
        string urlPicture;
        address publicAddress;
        string metadataHash;
        Status status;
    }

    mapping(uint256 => Document) private documents;

    // Event to emit when a document is verified
    event DocumentVerified(
        uint256 indexed tokenId,
        string urlPicture,
        address publicAddress,
        string metadataHash
    );

    constructor() ERC721("AuthenticalNFT", "AUT") Ownable(msg.sender) {
        verifier = msg.sender;
    }

    function mintDocumentNFT(
        address to,
        string memory urlPicture,
        address publicAddress,
        string memory metadataHash
    ) external returns (uint256) {
        uint256 tokenId = _tokenIds++;
        _safeMint(to, tokenId);

        documents[tokenId] = Document({
            urlPicture: urlPicture,
            publicAddress: publicAddress,
            metadataHash: metadataHash,
            status: Status.New
        });

        emit DocumentVerified(
            tokenId,
            urlPicture,
            publicAddress,
            metadataHash
        );
        
        return tokenId;
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
            documents[tokenId].status == Status.New,
            "DocumentNFT: Document is already verified or rejected"
        );

        documents[tokenId].status = Status.Verified;

        emit DocumentVerified(
            tokenId,
            documents[tokenId].urlPicture,
            documents[tokenId].publicAddress,
            documents[tokenId].metadataHash
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
        Status status
    ) external {
        require(msg.sender == verifier, "DocumentNFT: Caller is not the verifier");
        documents[tokenId].status = status;

        emit DocumentVerified(
            tokenId,
            documents[tokenId].urlPicture,
            documents[tokenId].publicAddress,
            documents[tokenId].metadataHash
        );
    }
}
