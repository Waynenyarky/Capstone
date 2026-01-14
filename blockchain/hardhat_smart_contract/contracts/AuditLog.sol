// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditLog
 * @dev Smart contract for immutable audit logging
 * Supports both hash-based logging (off-chain data) and full event logging (on-chain data)
 */
contract AuditLog {
    // Event emitted when an audit hash is logged (for off-chain data verification)
    event AuditHashLogged(
        bytes32 indexed hash,
        string eventType,
        uint256 timestamp,
        address indexed loggedBy
    );

    // Event emitted when a critical event is logged (full data on-chain)
    event CriticalEventLogged(
        string eventType,
        string userId,
        string details,
        uint256 timestamp,
        address indexed loggedBy
    );

    // Event emitted when admin approval is logged
    event AdminApprovalLogged(
        string approvalId,
        string eventType,
        string userId,
        string approverId,
        bool approved,
        string details,
        uint256 timestamp,
        address indexed loggedBy
    );

    // Struct to store audit hash entries
    struct AuditHashEntry {
        bytes32 hash;
        string eventType;
        uint256 timestamp;
        address loggedBy;
    }

    // Struct to store critical event entries
    struct CriticalEventEntry {
        string eventType;
        string userId;
        string details;
        uint256 timestamp;
        address loggedBy;
    }

    // Struct to store admin approval entries
    struct AdminApprovalEntry {
        string approvalId;
        string eventType;
        string userId;
        string approverId;
        bool approved;
        string details;
        uint256 timestamp;
        address loggedBy;
    }

    // Storage arrays
    AuditHashEntry[] public auditHashEntries;
    CriticalEventEntry[] public criticalEventEntries;
    AdminApprovalEntry[] public adminApprovalEntries;

    // Mapping for quick hash lookup
    mapping(bytes32 => bool) public hashExists;

    /**
     * @dev Log an audit hash (for off-chain data verification)
     * @param hash The SHA256 hash of the audit record stored off-chain
     * @param eventType The type of event (e.g., "profile_update", "email_change")
     */
    function logAuditHash(bytes32 hash, string memory eventType) public {
        require(hash != bytes32(0), "Hash cannot be zero");
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        require(!hashExists[hash], "Hash already exists");

        hashExists[hash] = true;
        
        auditHashEntries.push(AuditHashEntry({
            hash: hash,
            eventType: eventType,
            timestamp: block.timestamp,
            loggedBy: msg.sender
        }));

        emit AuditHashLogged(hash, eventType, block.timestamp, msg.sender);
    }

    /**
     * @dev Log a critical event with full details (on-chain storage)
     * @param eventType The type of event
     * @param userId The user ID affected
     * @param details JSON string with full event details
     */
    function logCriticalEvent(
        string memory eventType,
        string memory userId,
        string memory details
    ) public {
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        require(bytes(userId).length > 0, "User ID cannot be empty");

        criticalEventEntries.push(CriticalEventEntry({
            eventType: eventType,
            userId: userId,
            details: details,
            timestamp: block.timestamp,
            loggedBy: msg.sender
        }));

        emit CriticalEventLogged(eventType, userId, details, block.timestamp, msg.sender);
    }

    /**
     * @dev Log an admin approval event (on-chain storage)
     * @param approvalId Unique identifier for the approval request
     * @param eventType The type of event being approved
     * @param userId The user ID affected
     * @param approverId The admin ID who approved/rejected
     * @param approved Whether the request was approved
     * @param details Additional details about the approval
     */
    function logAdminApproval(
        string memory approvalId,
        string memory eventType,
        string memory userId,
        string memory approverId,
        bool approved,
        string memory details
    ) public {
        require(bytes(approvalId).length > 0, "Approval ID cannot be empty");
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(bytes(approverId).length > 0, "Approver ID cannot be empty");

        adminApprovalEntries.push(AdminApprovalEntry({
            approvalId: approvalId,
            eventType: eventType,
            userId: userId,
            approverId: approverId,
            approved: approved,
            details: details,
            timestamp: block.timestamp,
            loggedBy: msg.sender
        }));

        emit AdminApprovalLogged(
            approvalId,
            eventType,
            userId,
            approverId,
            approved,
            details,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Verify if a hash exists in the blockchain
     * @param hash The hash to verify
     * @return exists Whether the hash exists
     * @return timestamp The timestamp when the hash was logged
     */
    function verifyHash(bytes32 hash) public view returns (bool exists, uint256 timestamp) {
        exists = hashExists[hash];
        if (exists) {
            // Find the entry
            for (uint256 i = 0; i < auditHashEntries.length; i++) {
                if (auditHashEntries[i].hash == hash) {
                    timestamp = auditHashEntries[i].timestamp;
                    break;
                }
            }
        }
    }

    /**
     * @dev Get the total number of audit hash entries
     * @return count The total count
     */
    function getAuditHashCount() public view returns (uint256) {
        return auditHashEntries.length;
    }

    /**
     * @dev Get the total number of critical event entries
     * @return count The total count
     */
    function getCriticalEventCount() public view returns (uint256) {
        return criticalEventEntries.length;
    }

    /**
     * @dev Get the total number of admin approval entries
     * @return count The total count
     */
    function getAdminApprovalCount() public view returns (uint256) {
        return adminApprovalEntries.length;
    }
}
