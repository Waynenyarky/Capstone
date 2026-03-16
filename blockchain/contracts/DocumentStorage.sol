// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title DocumentStorage
 * @dev Smart contract for storing IPFS CIDs for documents
 * Links documents to users and tracks document versions
 */
contract DocumentStorage {
    AccessControl public accessControl;

    // Document types
    enum DocumentType {
        AVATAR,
        ID_FRONT,
        ID_BACK,
        BUSINESS_REGISTRATION,
        BIR_CERTIFICATE,
        LGU_DOCUMENT,
        OTHER
    }

    // Struct to store document information
    struct Document {
        string userId;
        DocumentType docType;
        string ipfsCid;
        uint256 uploadedAt;
        uint256 version;
    }

    // Mapping from userId to documentType to Document array (version history)
    mapping(string => mapping(DocumentType => Document[])) public documents;
    
    // Mapping from userId to documentType to current version index
    mapping(string => mapping(DocumentType => uint256)) public currentVersionIndex;

    // Events
    event DocumentStored(
        string indexed userId,
        DocumentType indexed docType,
        string ipfsCid,
        uint256 version,
        uint256 timestamp
    );

    modifier onlyDocumentManager() {
        require(
            accessControl.hasRole(msg.sender, accessControl.DOCUMENT_MANAGER_ROLE()),
            "DocumentStorage: caller does not have DOCUMENT_MANAGER_ROLE"
        );
        _;
    }

    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "DocumentStorage: invalid access control address");
        accessControl = AccessControl(_accessControlAddress);
    }

    /**
     * @dev Store a document CID for a user
     * @param userId The user identifier
     * @param docType The document type
     * @param ipfsCid The IPFS CID of the document
     */
    function storeDocument(
        string memory userId,
        DocumentType docType,
        string memory ipfsCid
    ) public onlyDocumentManager {
        require(bytes(userId).length > 0, "DocumentStorage: userId cannot be empty");
        require(bytes(ipfsCid).length > 0, "DocumentStorage: ipfsCid cannot be empty");

        Document[] storage docHistory = documents[userId][docType];
        uint256 currentVersion = docHistory.length > 0 
            ? docHistory[currentVersionIndex[userId][docType]].version + 1 
            : 1;

        Document memory newDoc = Document({
            userId: userId,
            docType: docType,
            ipfsCid: ipfsCid,
            uploadedAt: block.timestamp,
            version: currentVersion
        });

        docHistory.push(newDoc);
        currentVersionIndex[userId][docType] = docHistory.length - 1;

        emit DocumentStored(userId, docType, ipfsCid, currentVersion, block.timestamp);
    }

    /**
     * @dev Get the current document CID for a user and document type
     * @param userId The user identifier
     * @param docType The document type
     * @return ipfsCid The IPFS CID
     * @return version The document version
     * @return uploadedAt Upload timestamp
     */
    function getDocumentCid(
        string memory userId,
        DocumentType docType
    ) public view returns (
        string memory ipfsCid,
        uint256 version,
        uint256 uploadedAt
    ) {
        Document[] storage docHistory = documents[userId][docType];
        require(docHistory.length > 0, "DocumentStorage: document does not exist");

        uint256 currentIndex = currentVersionIndex[userId][docType];
        Document memory currentDoc = docHistory[currentIndex];
        
        return (currentDoc.ipfsCid, currentDoc.version, currentDoc.uploadedAt);
    }

    /**
     * @dev Get document history for a user and document type
     * @param userId The user identifier
     * @param docType The document type
     * @return cids Array of IPFS CIDs (all versions)
     * @return versions Array of version numbers
     * @return timestamps Array of upload timestamps
     */
    function getDocumentHistory(
        string memory userId,
        DocumentType docType
    ) public view returns (
        string[] memory cids,
        uint256[] memory versions,
        uint256[] memory timestamps
    ) {
        Document[] storage docHistory = documents[userId][docType];
        uint256 length = docHistory.length;
        
        cids = new string[](length);
        versions = new uint256[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            cids[i] = docHistory[i].ipfsCid;
            versions[i] = docHistory[i].version;
            timestamps[i] = docHistory[i].uploadedAt;
        }

        return (cids, versions, timestamps);
    }

    // =========================================================================
    // V2 GAS-OPTIMIZED METHODS
    // =========================================================================

    // V2 compact struct: stores hash of CID instead of full string
    struct DocumentHashEntry {
        bytes32 userIdHash;
        DocumentType docType;
        bytes32 cidHash;
        uint256 uploadedAt;
        uint256 version;
    }

    // V2 storage: userIdHash => docType => DocumentHashEntry[]
    mapping(bytes32 => mapping(DocumentType => DocumentHashEntry[])) public documentHashes;
    mapping(bytes32 => mapping(DocumentType => uint256)) public currentHashVersionIndex;

    // V2 events
    event DocumentHashStored(
        bytes32 indexed userIdHash,
        DocumentType indexed docType,
        bytes32 cidHash,
        uint256 version,
        uint256 timestamp
    );

    event BatchDocumentHashStored(
        uint256 count,
        uint256 timestamp,
        address indexed storedBy
    );

    /**
     * @dev V2: Store a document CID hash (full CID kept off-chain in DB/IPFS)
     * @param userIdHash Hash of the userId
     * @param docType The document type
     * @param cidHash Hash of the IPFS CID
     */
    function storeDocumentHash(
        bytes32 userIdHash,
        DocumentType docType,
        bytes32 cidHash
    ) public onlyDocumentManager {
        require(userIdHash != bytes32(0), "DocumentStorage: userIdHash cannot be zero");
        require(cidHash != bytes32(0), "DocumentStorage: cidHash cannot be zero");

        DocumentHashEntry[] storage history = documentHashes[userIdHash][docType];
        uint256 currentVersion = history.length > 0
            ? history[currentHashVersionIndex[userIdHash][docType]].version + 1
            : 1;

        history.push(DocumentHashEntry({
            userIdHash: userIdHash,
            docType: docType,
            cidHash: cidHash,
            uploadedAt: block.timestamp,
            version: currentVersion
        }));
        currentHashVersionIndex[userIdHash][docType] = history.length - 1;

        emit DocumentHashStored(userIdHash, docType, cidHash, currentVersion, block.timestamp);
    }

    /**
     * @dev V2: Batch store multiple document CID hashes in one transaction
     * @param userIdHashes Array of userId hashes
     * @param docTypes Array of document types
     * @param cidHashes Array of CID hashes
     */
    function batchStoreDocumentHash(
        bytes32[] memory userIdHashes,
        DocumentType[] memory docTypes,
        bytes32[] memory cidHashes
    ) public onlyDocumentManager {
        require(userIdHashes.length > 0, "Empty batch");
        require(userIdHashes.length <= 50, "Batch too large");
        require(userIdHashes.length == docTypes.length && docTypes.length == cidHashes.length, "Array length mismatch");

        for (uint256 i = 0; i < userIdHashes.length; i++) {
            if (userIdHashes[i] == bytes32(0) || cidHashes[i] == bytes32(0)) continue;

            DocumentHashEntry[] storage history = documentHashes[userIdHashes[i]][docTypes[i]];
            uint256 currentVersion = history.length > 0
                ? history[currentHashVersionIndex[userIdHashes[i]][docTypes[i]]].version + 1
                : 1;

            history.push(DocumentHashEntry({
                userIdHash: userIdHashes[i],
                docType: docTypes[i],
                cidHash: cidHashes[i],
                uploadedAt: block.timestamp,
                version: currentVersion
            }));
            currentHashVersionIndex[userIdHashes[i]][docTypes[i]] = history.length - 1;

            emit DocumentHashStored(userIdHashes[i], docTypes[i], cidHashes[i], currentVersion, block.timestamp);
        }

        emit BatchDocumentHashStored(userIdHashes.length, block.timestamp, msg.sender);
    }

    /**
     * @dev Check if a document exists for a user
     * @param userId The user identifier
     * @param docType The document type
     * @return bool True if document exists
     */
    function documentExists(string memory userId, DocumentType docType) public view returns (bool) {
        return documents[userId][docType].length > 0;
    }

    /**
     * @dev Get the number of versions for a document
     * @param userId The user identifier
     * @param docType The document type
     * @return count The number of versions
     */
    function getDocumentVersionCount(string memory userId, DocumentType docType) public view returns (uint256) {
        return documents[userId][docType].length;
    }
}
