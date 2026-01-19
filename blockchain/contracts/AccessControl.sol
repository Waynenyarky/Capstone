// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccessControl
 * @dev Role-based access control contract for managing permissions
 * Supports multiple roles: ADMIN, AUDITOR, USER_REGISTRAR, DOCUMENT_MANAGER
 */
contract AccessControl {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_REGISTRAR_ROLE = keccak256("USER_REGISTRAR_ROLE");
    bytes32 public constant DOCUMENT_MANAGER_ROLE = keccak256("DOCUMENT_MANAGER_ROLE");

    // Mapping from address to role to boolean
    mapping(address => mapping(bytes32 => bool)) private _roles;
    
    // Mapping to track role admins (who can grant/revoke roles)
    mapping(bytes32 => address) private _roleAdmins;
    
    // Owner of the contract (can grant/revoke any role)
    address public owner;

    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed grantedBy);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed revokedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "AccessControl: caller is not the owner");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(hasRole(msg.sender, role), "AccessControl: account does not have required role");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Grant owner all roles
        _roles[msg.sender][ADMIN_ROLE] = true;
        _roles[msg.sender][AUDITOR_ROLE] = true;
        _roles[msg.sender][USER_REGISTRAR_ROLE] = true;
        _roles[msg.sender][DOCUMENT_MANAGER_ROLE] = true;
        
        emit RoleGranted(ADMIN_ROLE, msg.sender, msg.sender);
        emit RoleGranted(AUDITOR_ROLE, msg.sender, msg.sender);
        emit RoleGranted(USER_REGISTRAR_ROLE, msg.sender, msg.sender);
        emit RoleGranted(DOCUMENT_MANAGER_ROLE, msg.sender, msg.sender);
    }

    /**
     * @dev Check if an account has a specific role
     * @param account The address to check
     * @param role The role to check
     * @return bool True if account has the role
     */
    function hasRole(address account, bytes32 role) public view returns (bool) {
        return _roles[account][role];
    }

    /**
     * @dev Grant a role to an account (only owner or role admin)
     * @param account The address to grant the role to
     * @param role The role to grant
     */
    function grantRole(address account, bytes32 role) public {
        require(
            msg.sender == owner || msg.sender == _roleAdmins[role],
            "AccessControl: caller is not authorized to grant this role"
        );
        require(!_roles[account][role], "AccessControl: account already has this role");
        
        _roles[account][role] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Revoke a role from an account (only owner or role admin)
     * @param account The address to revoke the role from
     * @param role The role to revoke
     */
    function revokeRole(address account, bytes32 role) public {
        require(
            msg.sender == owner || msg.sender == _roleAdmins[role],
            "AccessControl: caller is not authorized to revoke this role"
        );
        require(_roles[account][role], "AccessControl: account does not have this role");
        
        _roles[account][role] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    /**
     * @dev Set a role admin (only owner)
     * @param role The role to set admin for
     * @param admin The address to set as admin
     */
    function setRoleAdmin(bytes32 role, address admin) public onlyOwner {
        _roleAdmins[role] = admin;
    }

    /**
     * @dev Get the admin for a specific role
     * @param role The role to get admin for
     * @return address The admin address
     */
    function getRoleAdmin(bytes32 role) public view returns (address) {
        return _roleAdmins[role];
    }

    /**
     * @dev Transfer ownership of the contract
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "AccessControl: new owner is the zero address");
        
        address oldOwner = owner;
        owner = newOwner;
        
        // Transfer all roles from old owner to new owner
        _roles[newOwner][ADMIN_ROLE] = _roles[oldOwner][ADMIN_ROLE];
        _roles[newOwner][AUDITOR_ROLE] = _roles[oldOwner][AUDITOR_ROLE];
        _roles[newOwner][USER_REGISTRAR_ROLE] = _roles[oldOwner][USER_REGISTRAR_ROLE];
        _roles[newOwner][DOCUMENT_MANAGER_ROLE] = _roles[oldOwner][DOCUMENT_MANAGER_ROLE];
        
        _roles[oldOwner][ADMIN_ROLE] = false;
        _roles[oldOwner][AUDITOR_ROLE] = false;
        _roles[oldOwner][USER_REGISTRAR_ROLE] = false;
        _roles[oldOwner][DOCUMENT_MANAGER_ROLE] = false;
        
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
