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
