const blockchainService = require('./blockchainService');
const logger = require('./logger');

/**
 * Access Control Service
 * Handles role-based access control operations on the blockchain
 */
class AccessControlService {
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
    this.contract = contracts.accessControl;

    if (!this.contract) {
      logger.warn('AccessControl contract not available');
      return false;
    }

    return true;
  }

  /**
   * Check if an account has a specific role
   * @param {string} account - Ethereum address
   * @param {string} role - Role name (e.g., 'ADMIN_ROLE', 'AUDITOR_ROLE')
   * @returns {Promise<boolean>}
   */
  async hasRole(account, role) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return false;
    }

    try {
      // Convert role string to bytes32
      const roleBytes32 = blockchainService.getWeb3().utils.keccak256(role);
      const result = await this.contract.methods.hasRole(account, roleBytes32).call();
      return result;
    } catch (error) {
      logger.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Grant a role to an account
   * @param {string} account - Ethereum address
   * @param {string} role - Role name
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async grantRole(account, role) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'AccessControl contract not available' };
    }

    try {
      const roleBytes32 = blockchainService.getWeb3().utils.keccak256(role);
      const defaultAccount = blockchainService.getDefaultAccount();

      const gasEstimate = await this.contract.methods
        .grantRole(account, roleBytes32)
        .estimateGas({ from: defaultAccount });

      const tx = await this.contract.methods
        .grantRole(account, roleBytes32)
        .send({
          from: defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
      };
    } catch (error) {
      logger.error('Error granting role:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Revoke a role from an account
   * @param {string} account - Ethereum address
   * @param {string} role - Role name
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async revokeRole(account, role) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'AccessControl contract not available' };
    }

    try {
      const roleBytes32 = blockchainService.getWeb3().utils.keccak256(role);
      const defaultAccount = blockchainService.getDefaultAccount();

      const gasEstimate = await this.contract.methods
        .revokeRole(account, roleBytes32)
        .estimateGas({ from: defaultAccount });

      const tx = await this.contract.methods
        .revokeRole(account, roleBytes32)
        .send({
          from: defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
      };
    } catch (error) {
      logger.error('Error revoking role:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

// Create singleton instance
const accessControlService = new AccessControlService();

module.exports = accessControlService;
