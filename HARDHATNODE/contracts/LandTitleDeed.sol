// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LandTitleDeed is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _deedIds;

    struct TitleDeed {
        uint256 titleDeedNumber;
        uint256 userId;
        string transactionHash;
        string titleDeedName;
        string landCode;
        string ownerNationId;
        string ownerPhoneNumber;
        string landType;
        string landLayoutUrl;
    }

    // Mapping from deed ID to TitleDeed details
    mapping(uint256 => TitleDeed) private titleDeeds;
    // Mapping to keep track of all deed IDs for a given user ID
    mapping(uint256 => uint256[]) private userToTitleDeeds;
    // Mapping to retrieve deed ID by land code
    mapping(string => uint256) private landCodeToDeedId;

    event TitleDeedMinted(
        uint256 indexed titleDeedNumber,
        uint256 indexed userId,
        string transactionHash,
        string titleDeedName,
        string landCode,
        string ownerNationId,
        string ownerPhoneNumber,
        string landType,
        string landLayoutUrl
    );

    constructor() ERC721("LandTitleDeed", "LTD") Ownable() {}

    /**
     * @notice Mint a new title deed
     * @param userId The ID of the user who owns the deed
     * @param transactionHash The transaction hash for the deed creation
     * @param titleDeedName The name of the title deed
     * @param landCode A unique code representing the land
     * @param ownerNationId The national ID of the landowner
     * @param ownerPhoneNumber The phone number of the landowner
     * @param landType The type of the land (e.g., Customary, Leasehold)
     * @param landLayoutUrl URL to the land layout document or map
     */
    function mintTitleDeed(
        uint256 userId,
        string memory transactionHash,
        string memory titleDeedName,
        string memory landCode,
        string memory ownerNationId,
        string memory ownerPhoneNumber,
        string memory landType,
        string memory landLayoutUrl
    ) public onlyOwner {
        _deedIds.increment();
        uint256 newDeedId = _deedIds.current();

        _safeMint(msg.sender, newDeedId);

        TitleDeed memory newTitleDeed = TitleDeed({
            titleDeedNumber: newDeedId,
            userId: userId,
            transactionHash: transactionHash,
            titleDeedName: titleDeedName,
            landCode: landCode,
            ownerNationId: ownerNationId,
            ownerPhoneNumber: ownerPhoneNumber,
            landType: landType,
            landLayoutUrl: landLayoutUrl
        });

        titleDeeds[newDeedId] = newTitleDeed;
        userToTitleDeeds[userId].push(newDeedId);
        landCodeToDeedId[landCode] = newDeedId;

        emit TitleDeedMinted(
            newDeedId,
            userId,
            transactionHash,
            titleDeedName,
            landCode,
            ownerNationId,
            ownerPhoneNumber,
            landType,
            landLayoutUrl
        );
    }

    /**
     * @notice Retrieve all title deeds for a specific user
     * @param userId The ID of the user
     * @return An array of title deed numbers associated with the user
     */
    function getTitleDeedsByUser(
        uint256 userId
    ) public view returns (TitleDeed[] memory) {
        uint256[] memory deedIds = userToTitleDeeds[userId];
        TitleDeed[] memory deeds = new TitleDeed[](deedIds.length);

        for (uint256 i = 0; i < deedIds.length; i++) {
            deeds[i] = titleDeeds[deedIds[i]];
        }

        return deeds;
    }

    /**
     * @notice Retrieve a title deed by land code
     * @param landCode The code representing the land
     * @return The title deed details associated with the land code
     */
    function getTitleDeedByLandCode(
        string memory landCode
    ) public view returns (TitleDeed memory) {
        uint256 deedId = landCodeToDeedId[landCode];
        require(
            _exists(deedId),
            "Title deed does not exist for the provided land code"
        );
        return titleDeeds[deedId];
    }

    /**
     * @notice Retrieve a title deed by deed ID
     * @param deedId The unique ID of the title deed
     * @return The title deed details
     */
    function getTitleDeedById(
        uint256 deedId
    ) public view returns (TitleDeed memory) {
        require(_exists(deedId), "Title deed does not exist");
        return titleDeeds[deedId];
    }
}
