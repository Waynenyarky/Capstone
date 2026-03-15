// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title AuditLog
 * @dev Smart contract for immutable audit logging
 * Supports both hash-based logging (off-chain data) and full event logging (on-chain data)
 * Now uses AccessControl for role-based permissions
 */
contract AuditLog {
    AccessControl public accessControl;
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
    
    // OPTIMIZATION: Direct hash-to-timestamp mapping for O(1) lookup
    // Eliminates O(n) loop in verifyHash function
    mapping(bytes32 => uint256) public hashTimestamp;

    modifier onlyAuditor() {
        require(
            accessControl.hasRole(msg.sender, accessControl.AUDITOR_ROLE()),
            "AuditLog: caller does not have AUDITOR_ROLE"
        );
        _;
    }

    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "AuditLog: invalid access control address");
        accessControl = AccessControl(_accessControlAddress);
    }

    /**
     * @dev Log an audit hash (for off-chain data verification)
     * @param hash The SHA256 hash of the audit record stored off-chain
     * @param eventType The type of event (e.g., "profile_update", "email_change")
     */
    function logAuditHash(bytes32 hash, string memory eventType) public onlyAuditor {
        require(hash != bytes32(0), "Hash cannot be zero");
        require(bytes(eventType).length > 0, "Event type cannot be empty");
        require(!hashExists[hash], "Hash already exists");

        hashExists[hash] = true;
        hashTimestamp[hash] = block.timestamp;  // OPTIMIZATION: Store timestamp in mapping
        
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
    ) public onlyAuditor {
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
    ) public onlyAuditor {
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
            // OPTIMIZATION: O(1) lookup instead of O(n) loop
            // Before: iterated through entire auditHashEntries array
            // After: direct mapping lookup - constant time regardless of array size
            timestamp = hashTimestamp[hash];
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

    // =========================================================================
    // SPRINT 2 FEATURE: Audit History Retrieval
    // =========================================================================

    /**
     * @dev Get audit hash entries within a time range (paginated)
     * SPRINT 2 FEATURE: Allows retrieving historical audit data
     * @param startTime Unix timestamp for range start
     * @param endTime Unix timestamp for range end
     * @param offset Starting index for pagination
     * @param limit Maximum entries to return
     * @return hashes Array of hashes in range
     * @return timestamps Array of corresponding timestamps
     * @return eventTypes Array of event types
     * @return totalInRange Total count of entries in the time range
     */
    function getAuditHistory(
        uint256 startTime,
        uint256 endTime,
        uint256 offset,
        uint256 limit
    ) public view returns (
        bytes32[] memory hashes,
        uint256[] memory timestamps,
        string[] memory eventTypes,
        uint256 totalInRange
    ) {
        // First pass: count entries in range
        uint256 count = 0;
        for (uint256 i = 0; i < auditHashEntries.length; i++) {
            if (auditHashEntries[i].timestamp >= startTime && 
                auditHashEntries[i].timestamp <= endTime) {
                count++;
            }
        }
        totalInRange = count;

        // Calculate actual return size
        uint256 returnSize = count > offset ? count - offset : 0;
        if (returnSize > limit) {
            returnSize = limit;
        }

        // Allocate arrays
        hashes = new bytes32[](returnSize);
        timestamps = new uint256[](returnSize);
        eventTypes = new string[](returnSize);

        // Second pass: populate arrays
        uint256 found = 0;
        uint256 added = 0;
        for (uint256 i = 0; i < auditHashEntries.length && added < returnSize; i++) {
            if (auditHashEntries[i].timestamp >= startTime && 
                auditHashEntries[i].timestamp <= endTime) {
                if (found >= offset) {
                    hashes[added] = auditHashEntries[i].hash;
                    timestamps[added] = auditHashEntries[i].timestamp;
                    eventTypes[added] = auditHashEntries[i].eventType;
                    added++;
                }
                found++;
            }
        }
    }

    /**
     * @dev Get the most recent N audit entries
     * SPRINT 2 FEATURE: Quick access to recent audit activity
     * @param count Number of recent entries to retrieve
     * @return hashes Array of recent hashes
     * @return timestamps Array of timestamps
     * @return eventTypes Array of event types
     */
    function getRecentAudits(uint256 count) public view returns (
        bytes32[] memory hashes,
        uint256[] memory timestamps,
        string[] memory eventTypes
    ) {
        uint256 total = auditHashEntries.length;
        uint256 returnSize = count > total ? total : count;

        hashes = new bytes32[](returnSize);
        timestamps = new uint256[](returnSize);
        eventTypes = new string[](returnSize);

        for (uint256 i = 0; i < returnSize; i++) {
            uint256 idx = total - returnSize + i;
            hashes[i] = auditHashEntries[idx].hash;
            timestamps[i] = auditHashEntries[idx].timestamp;
            eventTypes[i] = auditHashEntries[idx].eventType;
        }
    }

    /**
     * @dev Get audit statistics
     * SPRINT 2 FEATURE: Dashboard statistics for audit overview
     * @return totalHashes Total number of audit hashes
     * @return totalCriticalEvents Total critical events
     * @return totalApprovals Total admin approvals
     * @return latestTimestamp Timestamp of most recent entry
     */
    function getAuditStats() public view returns (
        uint256 totalHashes,
        uint256 totalCriticalEvents,
        uint256 totalApprovals,
        uint256 latestTimestamp
    ) {
        totalHashes = auditHashEntries.length;
        totalCriticalEvents = criticalEventEntries.length;
        totalApprovals = adminApprovalEntries.length;
        
        if (auditHashEntries.length > 0) {
            latestTimestamp = auditHashEntries[auditHashEntries.length - 1].timestamp;
        }
    }
}
