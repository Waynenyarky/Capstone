const ethers = require('ethers');
const AuditLog = require('../models/AuditLog');

/**
 * Blockchain Service for Audit Logging
 * Handles interactions with Ethereum smart contracts via Ganache
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.contractAddress = null;
    this.initialized = false;
  }

  /**
   * Initialize the blockchain service
   * Must be called before using any other methods
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
    let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    this.contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;

    // Use development defaults if not set (for local Ganache)
    if (!privateKey) {
      console.warn('⚠️  DEPLOYER_PRIVATE_KEY not set. Using development default (first Ganache account).');
      // Default private key from Ganache's first account (for development only)
      // This is a well-known test private key - NEVER use in production
      privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
      console.warn('⚠️  Using test private key. Set DEPLOYER_PRIVATE_KEY in production!');
    }

    if (!this.contractAddress) {
      console.warn('⚠️  AUDIT_CONTRACT_ADDRESS not set. Blockchain service will initialize but logging will be limited.');
      // Don't return - allow service to initialize for read-only operations
      this.contractAddress = null;
    }

    try {
      // Connect to Ganache or specified RPC
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Create signer from private key
      this.signer = new ethers.Wallet(privateKey, this.provider);
      
      // If contract address is not set, still initialize provider and signer for potential future use
      if (!this.contractAddress) {
        const network = await this.provider.getNetwork();
        const balance = await this.provider.getBalance(this.signer.address);
        
        console.log('✅ Blockchain service initialized (read-only mode)');
        console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`   Account: ${this.signer.address}`);
        console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`   ⚠️  Contract address not set. Set AUDIT_CONTRACT_ADDRESS to enable full logging.`);
        
        this.initialized = true;
        return;
      }

      // Contract ABI (minimal ABI for the functions we need)
      const contractABI = [
        'function logAuditHash(bytes32 hash, string eventType) public',
        'function logCriticalEvent(string eventType, string userId, string details) public',
        'function logAdminApproval(string approvalId, string eventType, string userId, string approverId, bool approved, string details) public',
        'function verifyHash(bytes32 hash) public view returns (bool exists, uint256 timestamp)',
        'function getAuditHashCount() public view returns (uint256)',
        'function getCriticalEventCount() public view returns (uint256)',
        'function getAdminApprovalCount() public view returns (uint256)',
        'event AuditHashLogged(bytes32 indexed hash, string eventType, uint256 timestamp, address indexed loggedBy)',
        'event CriticalEventLogged(string eventType, string userId, string details, uint256 timestamp, address indexed loggedBy)',
        'event AdminApprovalLogged(string approvalId, string eventType, string userId, string approverId, bool approved, string details, uint256 timestamp, address indexed loggedBy)',
      ];

      // Get contract instance
      this.contract = new ethers.Contract(this.contractAddress, contractABI, this.signer);

      // Verify connection
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.signer.address);

      console.log('✅ Blockchain service initialized');
      console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`   Contract: ${this.contractAddress}`);
      console.log(`   Account: ${this.signer.address}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      console.warn('⚠️  Blockchain logging will be disabled.');
    }
  }

  /**
   * Check if blockchain service is available
   */
  isAvailable() {
    return this.initialized && this.contract !== null;
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
      const hashBytes32 = ethers.hexlify(ethers.zeroPadValue(hashWithPrefix, 32));

      // Estimate gas
      const gasEstimate = await this.contract.logAuditHash.estimateGas(hashBytes32, eventType);

      // Send transaction
      const tx = await this.contract.logAuditHash(hashBytes32, eventType, {
        gasLimit: gasEstimate * BigInt(2), // Add buffer for gas
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error logging audit hash to blockchain:', error);
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
      const gasEstimate = await this.contract.logCriticalEvent.estimateGas(
        eventType,
        userId,
        detailsString
      );

      // Send transaction
      const tx = await this.contract.logCriticalEvent(eventType, userId, detailsString, {
        gasLimit: gasEstimate * BigInt(2),
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error logging critical event to blockchain:', error);
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
      const gasEstimate = await this.contract.logAdminApproval.estimateGas(
        approvalId,
        eventType,
        userId,
        approverId,
        approved,
        detailsString
      );

      // Send transaction
      const tx = await this.contract.logAdminApproval(
        approvalId,
        eventType,
        userId,
        approverId,
        approved,
        detailsString,
        {
          gasLimit: gasEstimate * BigInt(2),
        }
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error logging admin approval to blockchain:', error);
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
      // Hash from MongoDB is hex string without '0x' prefix
      const hashWithPrefix = hash.startsWith('0x') ? hash : `0x${hash}`;
      const hashBytes32 = ethers.hexlify(ethers.zeroPadValue(hashWithPrefix, 32));

      // Call view function
      const [exists, timestamp] = await this.contract.verifyHash(hashBytes32);

      return {
        exists,
        timestamp: exists ? Number(timestamp) : null,
      };
    } catch (error) {
      console.error('Error verifying hash on blockchain:', error);
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
        this.contract.getAuditHashCount(),
        this.contract.getCriticalEventCount(),
        this.contract.getAdminApprovalCount(),
      ]);

      return {
        auditHashCount: Number(auditHashCount),
        criticalEventCount: Number(criticalEventCount),
        adminApprovalCount: Number(adminApprovalCount),
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return {
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Cleanup: Close provider connections
   * Should be called in tests to prevent Jest from hanging
   */
  async cleanup() {
    if (this.provider) {
      try {
        // Destroy the provider to close connections
        if (this.provider.destroy) {
          await this.provider.destroy();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      this.provider = null;
    }
    this.contract = null;
    this.signer = null;
    this.initialized = false;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
