const { Web3 } = require('web3');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Blockchain Service for Audit Logging
 * Handles interactions with Ethereum smart contracts via Ganache using web3.js
 * Supports multiple contracts: AccessControl, UserRegistry, DocumentStorage, AuditLog
 */
class BlockchainService {
  constructor() {
    this.web3 = null;
    this.accounts = null;
    this.defaultAccount = null;
    this.contracts = {
      accessControl: null,
      userRegistry: null,
      documentStorage: null,
      auditLog: null,
    };
    this.contractAddresses = {
      accessControl: null,
      userRegistry: null,
      documentStorage: null,
      auditLog: null,
    };
    this.initialized = false;
  }

  /**
   * Load contract ABI from Truffle artifacts
   * @param {string} contractName - Name of the contract
   * @returns {object|null} Contract ABI or null if not found
   */
  loadContractABI(contractName) {
    try {
      // Docker: try shared volume mount first (contract_addresses at /app/contract-addresses)
      const abiDir = process.env.CONTRACT_ABI_PATH || '/app/contract-addresses';
      const dockerPath = path.join(abiDir, `${contractName}.json`);
      if (fs.existsSync(dockerPath)) {
        const artifact = JSON.parse(fs.readFileSync(dockerPath, 'utf8'));
        return artifact.abi;
      }

      // Try to load from Truffle build directory (relative to project root)
      const artifactPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'blockchain',
        'build',
        'contracts',
        `${contractName}.json`
      );

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
      }

      // Fallback: Try to load from hardhat artifacts (for backward compatibility)
      const hardhatPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'blockchain',
        'hardhat_smart_contract',
        'artifacts',
        'contracts',
        `${contractName}.sol`,
        `${contractName}.json`
      );

      if (fs.existsSync(hardhatPath)) {
        const artifact = JSON.parse(fs.readFileSync(hardhatPath, 'utf8'));
        return artifact.abi;
      }

      logger.warn(`Contract ABI not found for ${contractName}, using minimal ABI`);
      return null;
    } catch (error) {
      logger.error(`Error loading contract ABI for ${contractName}:`, error);
      return null;
    }
  }

  /**
   * Initialize the blockchain service
   * Must be called before using any other methods
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    const rpcUrl = process.env.GANACHE_RPC_URL || process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545';
    let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    // Get contract addresses from environment
    this.contractAddresses.accessControl = process.env.ACCESS_CONTROL_CONTRACT_ADDRESS;
    this.contractAddresses.userRegistry = process.env.USER_REGISTRY_CONTRACT_ADDRESS;
    this.contractAddresses.documentStorage = process.env.DOCUMENT_STORAGE_CONTRACT_ADDRESS;
    this.contractAddresses.auditLog = process.env.AUDIT_LOG_CONTRACT_ADDRESS || process.env.AUDIT_CONTRACT_ADDRESS; // Backward compatibility

    // Use development defaults if not set (for local Ganache)
    if (!privateKey) {
      logger.warn('⚠️  DEPLOYER_PRIVATE_KEY not set. Using development default (first Ganache account).');
      // Default private key from Ganache's first account (for development only)
      privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
      logger.warn('⚠️  Using test private key. Set DEPLOYER_PRIVATE_KEY in production!');
    }

    try {
      // Initialize Web3
      this.web3 = new Web3(rpcUrl);

      // Get accounts
      this.accounts = await this.web3.eth.getAccounts();
      
      // Create account from private key
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      this.web3.eth.accounts.wallet.add(account);
      this.defaultAccount = account.address;

      // Load and initialize contracts
      if (this.contractAddresses.auditLog) {
        const auditLogABI = this.loadContractABI('AuditLog') || this.getMinimalAuditLogABI();
        this.contracts.auditLog = new this.web3.eth.Contract(auditLogABI, this.contractAddresses.auditLog);
      }

      if (this.contractAddresses.accessControl) {
        const accessControlABI = this.loadContractABI('AccessControl') || this.getMinimalAccessControlABI();
        this.contracts.accessControl = new this.web3.eth.Contract(accessControlABI, this.contractAddresses.accessControl);
      }

      if (this.contractAddresses.userRegistry) {
        const userRegistryABI = this.loadContractABI('UserRegistry') || this.getMinimalUserRegistryABI();
        this.contracts.userRegistry = new this.web3.eth.Contract(userRegistryABI, this.contractAddresses.userRegistry);
      }

      if (this.contractAddresses.documentStorage) {
        const documentStorageABI = this.loadContractABI('DocumentStorage') || this.getMinimalDocumentStorageABI();
        this.contracts.documentStorage = new this.web3.eth.Contract(documentStorageABI, this.contractAddresses.documentStorage);
      }

      // Verify connection
      const networkId = await this.web3.eth.net.getId();
      const balance = await this.web3.eth.getBalance(this.defaultAccount);
      const balanceEth = this.web3.utils.fromWei(balance, 'ether');

      logger.info('✅ Blockchain service initialized');
      logger.info(`   Network ID: ${networkId}`);
      logger.info(`   Account: ${this.defaultAccount}`);
      logger.info(`   Balance: ${balanceEth} ETH`);
      
      if (this.contractAddresses.auditLog) {
        logger.info(`   AuditLog Contract: ${this.contractAddresses.auditLog}`);
      } else {
        logger.warn('⚠️  AUDIT_LOG_CONTRACT_ADDRESS not set. Audit logging will be limited.');
      }

      this.initialized = true;
    } catch (error) {
      logger.error('❌ Failed to initialize blockchain service:', error);
      logger.warn('⚠️  Blockchain logging will be disabled.');
    }
  }

  /**
   * Get minimal ABI for AuditLog contract (fallback)
   */
  getMinimalAuditLogABI() {
    return [
      {
        "inputs": [
          { "internalType": "bytes32", "name": "hash", "type": "bytes32" },
          { "internalType": "string", "name": "eventType", "type": "string" }
        ],
        "name": "logAuditHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "hash", "type": "bytes32" }
        ],
        "name": "verifyHash",
        "outputs": [
          { "internalType": "bool", "name": "exists", "type": "bool" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAuditHashCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Get minimal ABI for AccessControl contract (fallback)
   */
  getMinimalAccessControlABI() {
    return [
      {
        "inputs": [
          { "internalType": "address", "name": "account", "type": "address" },
          { "internalType": "bytes32", "name": "role", "type": "bytes32" }
        ],
        "name": "hasRole",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "account", "type": "address" },
          { "internalType": "bytes32", "name": "role", "type": "bytes32" }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  /**
   * Get minimal ABI for UserRegistry contract (fallback)
   */
  getMinimalUserRegistryABI() {
    return [
      {
        "inputs": [
          { "internalType": "string", "name": "userId", "type": "string" },
          { "internalType": "address", "name": "userAddress", "type": "address" },
          { "internalType": "bytes32", "name": "profileHash", "type": "bytes32" }
        ],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "userId", "type": "string" }
        ],
        "name": "getUserProfileHash",
        "outputs": [
          { "internalType": "address", "name": "userAddress", "type": "address" },
          { "internalType": "bytes32", "name": "profileHash", "type": "bytes32" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
          { "internalType": "uint256", "name": "lastUpdatedAt", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Get minimal ABI for DocumentStorage contract (fallback)
   */
  getMinimalDocumentStorageABI() {
    return [
      {
        "inputs": [
          { "internalType": "string", "name": "userId", "type": "string" },
          { "internalType": "uint8", "name": "docType", "type": "uint8" },
          { "internalType": "string", "name": "ipfsCid", "type": "string" }
        ],
        "name": "storeDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "string", "name": "userId", "type": "string" },
          { "internalType": "uint8", "name": "docType", "type": "uint8" }
        ],
        "name": "getDocumentCid",
        "outputs": [
          { "internalType": "string", "name": "ipfsCid", "type": "string" },
          { "internalType": "uint256", "name": "version", "type": "uint256" },
          { "internalType": "uint256", "name": "uploadedAt", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Check if blockchain service is available
   */
  isAvailable() {
    return this.initialized && this.contracts.auditLog !== null;
  }

  /**
   * Log an audit hash to the blockchain (for off-chain data verification)
   * @param {string} hash - SHA256 hash of the audit record
   * @param {string} eventType - Type of event (e.g., 'profile_update', 'email_change')
   * @returns {Promise<{success: boolean, txHash?: string, blockNumber?: number, error?: string}>}
   */
  async logAuditHash(hash, eventType) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Blockchain service not initialized',
      };
    }

    try {
      // Convert hex string to bytes32
      // Hash from MongoDB is hex string without '0x' prefix
      const hashWithPrefix = hash.startsWith('0x') ? hash : `0x${hash}`;
      const hashBytes32 = this.web3.utils.padLeft(hashWithPrefix, 64);

      // Estimate gas
      const gasEstimate = await this.contracts.auditLog.methods
        .logAuditHash(hashBytes32, eventType)
        .estimateGas({ from: this.defaultAccount });

      // Send transaction
      const tx = await this.contracts.auditLog.methods
        .logAuditHash(hashBytes32, eventType)
        .send({
          from: this.defaultAccount,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        });

      return {
        success: true,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      };
    } catch (error) {
      logger.error('Error logging audit hash to blockchain:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Log a critical event with full details (on-chain storage)
   * @param {string} eventType - Type of event
   * @param {string} userId - User ID affected
   * @param {string|object} details - Full event details (will be JSON stringified if object)
   * @returns {Promise<{success: boolean, txHash?: string, blockNumber?: number, error?: string}>}
   */
  async logCriticalEvent(eventType, userId, details) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Blockchain service not initialized',
      };
    }

    try {
      // Convert details to JSON string if it's an object
      const detailsString = typeof details === 'string' ? details : JSON.stringify(details);

      // Estimate gas
      const gasEstimate = await this.contracts.auditLog.methods
        .logCriticalEvent(eventType, userId, detailsString)
        .estimateGas({ from: this.defaultAccount });

      // Send transaction
      const tx = await this.contracts.auditLog.methods
        .logCriticalEvent(eventType, userId, detailsString)
        .send({
          from: this.defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      };
    } catch (error) {
      logger.error('Error logging critical event to blockchain:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Log an admin approval event (on-chain storage)
   * @param {string} approvalId - Unique identifier for the approval
   * @param {string} eventType - Type of event being approved
   * @param {string} userId - User ID affected
   * @param {string} approverId - Admin ID who approved/rejected
   * @param {boolean} approved - Whether the request was approved
   * @param {string|object} details - Additional details (will be JSON stringified if object)
   * @returns {Promise<{success: boolean, txHash?: string, blockNumber?: number, error?: string}>}
   */
  async logAdminApproval(approvalId, eventType, userId, approverId, approved, details) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Blockchain service not initialized',
      };
    }

    try {
      // Convert details to JSON string if it's an object
      const detailsString = typeof details === 'string' ? details : JSON.stringify(details);

      // Estimate gas
      const gasEstimate = await this.contracts.auditLog.methods
        .logAdminApproval(approvalId, eventType, userId, approverId, approved, detailsString)
        .estimateGas({ from: this.defaultAccount });

      // Send transaction
      const tx = await this.contracts.auditLog.methods
        .logAdminApproval(approvalId, eventType, userId, approverId, approved, detailsString)
        .send({
          from: this.defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
      };
    } catch (error) {
      logger.error('Error logging admin approval to blockchain:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Verify if a hash exists on the blockchain
   * @param {string} hash - SHA256 hash to verify
   * @returns {Promise<{exists: boolean, timestamp?: number, error?: string}>}
   */
  async verifyHash(hash) {
    if (!this.isAvailable()) {
      return {
        exists: false,
        error: 'Blockchain service not initialized',
      };
    }

    try {
      // Convert hex string to bytes32
      const hashWithPrefix = hash.startsWith('0x') ? hash : `0x${hash}`;
      const hashBytes32 = this.web3.utils.padLeft(hashWithPrefix, 64);

      // Call view function
      const result = await this.contracts.auditLog.methods.verifyHash(hashBytes32).call();

      return {
        exists: result.exists,
        timestamp: result.exists ? Number(result.timestamp) : null,
      };
    } catch (error) {
      logger.error('Error verifying hash on blockchain:', error);
      return {
        exists: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get contract statistics
   * @returns {Promise<{auditHashCount?: number, criticalEventCount?: number, adminApprovalCount?: number, error?: string}>}
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        error: 'Blockchain service not initialized',
      };
    }

    try {
      const [auditHashCount, criticalEventCount, adminApprovalCount] = await Promise.all([
        this.contracts.auditLog.methods.getAuditHashCount().call(),
        this.contracts.auditLog.methods.getCriticalEventCount().call(),
        this.contracts.auditLog.methods.getAdminApprovalCount().call(),
      ]);

      return {
        auditHashCount: Number(auditHashCount),
        criticalEventCount: Number(criticalEventCount),
        adminApprovalCount: Number(adminApprovalCount),
      };
    } catch (error) {
      logger.error('Error getting blockchain stats:', error);
      return {
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get contract instances (for use by other services)
   */
  getContracts() {
    return this.contracts;
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return this.contractAddresses;
  }

  /**
   * Get Web3 instance (for advanced usage)
   */
  getWeb3() {
    return this.web3;
  }

  /**
   * Get default account
   */
  getDefaultAccount() {
    return this.defaultAccount;
  }

  /**
   * Cleanup: Close provider connections
   * Should be called in tests to prevent Jest from hanging
   */
  async cleanup() {
    if (this.web3 && this.web3.currentProvider && this.web3.currentProvider.disconnect) {
      try {
        await this.web3.currentProvider.disconnect();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.web3 = null;
    this.accounts = null;
    this.defaultAccount = null;
    this.contracts = {
      accessControl: null,
      userRegistry: null,
      documentStorage: null,
      auditLog: null,
    };
    this.initialized = false;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
