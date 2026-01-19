// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title UserRegistry
 * @dev Smart contract for storing user identity and profile data hashes
 * Links user IDs to Ethereum addresses and stores profile hashes
 */
contract UserRegistry {
    AccessControl public accessControl;

    // Struct to store user information
    struct UserInfo {
        string userId;
        address userAddress;
        bytes32 profileHash;
        uint256 registeredAt;
        uint256 lastUpdatedAt;
    }

    // Mapping from userId to UserInfo
    mapping(string => UserInfo) public users;
    
    // Mapping from address to userId (for reverse lookup)
    mapping(address => string) public addressToUserId;
    
    // Array to track all registered user IDs
    string[] public registeredUserIds;

    // Events
    event UserRegistered(
        string indexed userId,
        address indexed userAddress,
        bytes32 profileHash,
        uint256 timestamp
    );

    event ProfileHashUpdated(
        string indexed userId,
        bytes32 oldHash,
        bytes32 newHash,
        uint256 timestamp
    );

    modifier onlyUserRegistrar() {
        require(
            accessControl.hasRole(msg.sender, accessControl.USER_REGISTRAR_ROLE()),
            "UserRegistry: caller does not have USER_REGISTRAR_ROLE"
        );
        _;
    }

    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "UserRegistry: invalid access control address");
        accessControl = AccessControl(_accessControlAddress);
    }

    /**
     * @dev Register a new user or update existing user
     * @param userId The unique user identifier
     * @param userAddress The Ethereum address associated with the user
     * @param profileHash The SHA256 hash of the user's profile data
     */
    function registerUser(
        string memory userId,
        address userAddress,
        bytes32 profileHash
    ) public onlyUserRegistrar {
        require(bytes(userId).length > 0, "UserRegistry: userId cannot be empty");
        require(userAddress != address(0), "UserRegistry: userAddress cannot be zero");
        require(profileHash != bytes32(0), "UserRegistry: profileHash cannot be zero");

        bool isNewUser = bytes(users[userId].userId).length == 0;

        if (isNewUser) {
            // New user registration
            users[userId] = UserInfo({
                userId: userId,
                userAddress: userAddress,
                profileHash: profileHash,
                registeredAt: block.timestamp,
                lastUpdatedAt: block.timestamp
            });
            
            addressToUserId[userAddress] = userId;
            registeredUserIds.push(userId);
            
            emit UserRegistered(userId, userAddress, profileHash, block.timestamp);
        } else {
            // Update existing user
            bytes32 oldHash = users[userId].profileHash;
            users[userId].userAddress = userAddress;
            users[userId].profileHash = profileHash;
            users[userId].lastUpdatedAt = block.timestamp;
            
            // Update address mapping if different
            string memory currentUserId = addressToUserId[userAddress];
            if (keccak256(bytes(currentUserId)) != keccak256(bytes(userId))) {
                addressToUserId[userAddress] = userId;
            }
            
            emit ProfileHashUpdated(userId, oldHash, profileHash, block.timestamp);
        }
    }

    /**
     * @dev Update profile hash for an existing user
     * @param userId The user identifier
     * @param newProfileHash The new profile hash
     */
    function updateProfileHash(string memory userId, bytes32 newProfileHash) public onlyUserRegistrar {
        require(bytes(userId).length > 0, "UserRegistry: userId cannot be empty");
        require(bytes(users[userId].userId).length > 0, "UserRegistry: user does not exist");
        require(newProfileHash != bytes32(0), "UserRegistry: profileHash cannot be zero");

        bytes32 oldHash = users[userId].profileHash;
        users[userId].profileHash = newProfileHash;
        users[userId].lastUpdatedAt = block.timestamp;

        emit ProfileHashUpdated(userId, oldHash, newProfileHash, block.timestamp);
    }

    /**
     * @dev Get user information by userId
     * @param userId The user identifier
     * @return userAddress The Ethereum address
     * @return profileHash The profile hash
     * @return registeredAt Registration timestamp
     * @return lastUpdatedAt Last update timestamp
     */
    function getUserProfileHash(string memory userId) public view returns (
        address userAddress,
        bytes32 profileHash,
        uint256 registeredAt,
        uint256 lastUpdatedAt
    ) {
        require(bytes(users[userId].userId).length > 0, "UserRegistry: user does not exist");
        
        UserInfo memory user = users[userId];
        return (
            user.userAddress,
            user.profileHash,
            user.registeredAt,
            user.lastUpdatedAt
        );
    }

    /**
     * @dev Get userId by Ethereum address
     * @param userAddress The Ethereum address
     * @return userId The user identifier
     */
    function getUserIdByAddress(address userAddress) public view returns (string memory) {
        return addressToUserId[userAddress];
    }

    /**
     * @dev Check if a user exists
     * @param userId The user identifier
     * @return bool True if user exists
     */
    function userExists(string memory userId) public view returns (bool) {
        return bytes(users[userId].userId).length > 0;
    }

    /**
     * @dev Get total number of registered users
     * @return count The total count
     */
    function getTotalUserCount() public view returns (uint256) {
        return registeredUserIds.length;
    }
}
