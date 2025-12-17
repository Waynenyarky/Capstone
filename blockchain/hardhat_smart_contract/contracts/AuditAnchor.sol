// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditAnchor
 * @dev A simple contract to anchor audit hashes to the blockchain for immutability and verification.
 */
contract AuditAnchor {
    /**
     * @dev Emitted when a new audit hash is anchored.
     * @param auditHash The SHA-256 hash of the audit event.
     * @param source The source system identifier (e.g., "backend-api", "mobile-app").
     * @param timestamp The block timestamp when the anchor occurred.
     * @param blockNumber The block number where the transaction was mined.
     */
    event Anchored(
        bytes32 indexed auditHash,
        string source,
        uint256 timestamp,
        uint256 blockNumber
    );

    /**
     * @dev Anchors a hash to the blockchain by emitting an event.
     * Storing data in events is cheaper than contract storage and sufficient for audit trails
     * since we only need to verify existence and timestamp.
     * 
     * @param _hash The SHA-256 hash of the canonicalized audit event.
     * @param _source The source system identifier.
     */
    function anchor(bytes32 _hash, string memory _source) public {
        emit Anchored(_hash, _source, block.timestamp, block.number);
    }
}
