const blockchainService = require('./blockchainService');
const logger = require('./logger');

/**
 * User Registry Service
 * Handles user identity and profile hash storage on the blockchain
 */
class UserRegistryService {
  constructor() {
    this.contract = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (!blockchainService.isAvailable()) {
      await blockchainService.initialize();
    }

    const contracts = blockchainService.getContracts();
    this.contract = contracts.userRegistry;

    if (!this.contract) {
      logger.warn('UserRegistry contract not available');
      return false;
    }

    return true;
  }

  /**
   * Register a new user or update existing user
   * @param {string} userId - User identifier
   * @param {string} userAddress - Ethereum address
   * @param {string} profileHash - SHA256 hash of profile data
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async registerUser(userId, userAddress, profileHash) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'UserRegistry contract not available' };
    }

    try {
      // Convert hash to bytes32
      const hashWithPrefix = profileHash.startsWith('0x') ? profileHash : `0x${profileHash}`;
      const hashBytes32 = blockchainService.getWeb3().utils.padLeft(hashWithPrefix, 64);

      const defaultAccount = blockchainService.getDefaultAccount();

      const gasEstimate = await this.contract.methods
        .registerUser(userId, userAddress, hashBytes32)
        .estimateGas({ from: defaultAccount });

      const tx = await this.contract.methods
        .registerUser(userId, userAddress, hashBytes32)
        .send({
          from: defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
      };
    } catch (error) {
      logger.error('Error registering user:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Update profile hash for an existing user
   * @param {string} userId - User identifier
   * @param {string} newProfileHash - New SHA256 hash of profile data
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async updateProfileHash(userId, newProfileHash) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'UserRegistry contract not available' };
    }

    try {
      const hashWithPrefix = newProfileHash.startsWith('0x') ? newProfileHash : `0x${newProfileHash}`;
      const hashBytes32 = blockchainService.getWeb3().utils.padLeft(hashWithPrefix, 64);

      const defaultAccount = blockchainService.getDefaultAccount();

      const gasEstimate = await this.contract.methods
        .updateProfileHash(userId, hashBytes32)
        .estimateGas({ from: defaultAccount });

      const tx = await this.contract.methods
        .updateProfileHash(userId, hashBytes32)
        .send({
          from: defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
      };
    } catch (error) {
      logger.error('Error updating profile hash:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get user profile hash
   * @param {string} userId - User identifier
   * @returns {Promise<{success: boolean, userAddress?: string, profileHash?: string, registeredAt?: number, lastUpdatedAt?: number, error?: string}>}
   */
  async getUserProfileHash(userId) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'UserRegistry contract not available' };
    }

    try {
      const result = await this.contract.methods.getUserProfileHash(userId).call();

      return {
        success: true,
        userAddress: result.userAddress,
        profileHash: result.profileHash,
        registeredAt: Number(result.registeredAt),
        lastUpdatedAt: Number(result.lastUpdatedAt),
      };
    } catch (error) {
      logger.error('Error getting user profile hash:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get userId by Ethereum address
   * @param {string} userAddress - Ethereum address
   * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
   */
  async getUserIdByAddress(userAddress) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'UserRegistry contract not available' };
    }

    try {
      const userId = await this.contract.methods.getUserIdByAddress(userAddress).call();

      return {
        success: true,
        userId: userId || null,
      };
    } catch (error) {
      logger.error('Error getting userId by address:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check if user exists
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>}
   */
  async userExists(userId) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return false;
    }

    try {
      const exists = await this.contract.methods.userExists(userId).call();
      return exists;
    } catch (error) {
      logger.error('Error checking if user exists:', error);
      return false;
    }
  }
}

// Create singleton instance
const userRegistryService = new UserRegistryService();

module.exports = userRegistryService;
