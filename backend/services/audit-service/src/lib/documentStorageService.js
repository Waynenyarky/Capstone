const blockchainService = require('./blockchainService');
const logger = require('./logger');

/**
 * Document Storage Service
 * Handles IPFS CID storage on the blockchain
 */
class DocumentStorageService {
  constructor() {
    this.contract = null;
    // Document type enum mapping
    this.documentTypes = {
      AVATAR: 0,
      ID_FRONT: 1,
      ID_BACK: 2,
      BUSINESS_REGISTRATION: 3,
      BIR_CERTIFICATE: 4,
      LGU_DOCUMENT: 5,
      OTHER: 6,
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (!blockchainService.isAvailable()) {
      await blockchainService.initialize();
    }

    const contracts = blockchainService.getContracts();
    this.contract = contracts.documentStorage;

    if (!this.contract) {
      logger.warn('DocumentStorage contract not available');
      return false;
    }

    return true;
  }

  /**
   * Get document type enum value
   * @param {string} docType - Document type name
   * @returns {number} Enum value
   */
  getDocumentType(docType) {
    const upperType = docType.toUpperCase();
    if (this.documentTypes[upperType] !== undefined) {
      return this.documentTypes[upperType];
    }
    return this.documentTypes.OTHER;
  }

  /**
   * Store a document CID for a user
   * @param {string} userId - User identifier
   * @param {string} docType - Document type (e.g., 'AVATAR', 'ID_FRONT', 'BUSINESS_REGISTRATION')
   * @param {string} ipfsCid - IPFS CID of the document
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async storeDocument(userId, docType, ipfsCid) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'DocumentStorage contract not available' };
    }

    try {
      const docTypeEnum = this.getDocumentType(docType);
      const defaultAccount = blockchainService.getDefaultAccount();

      const gasEstimate = await this.contract.methods
        .storeDocument(userId, docTypeEnum, ipfsCid)
        .estimateGas({ from: defaultAccount });

      const tx = await this.contract.methods
        .storeDocument(userId, docTypeEnum, ipfsCid)
        .send({
          from: defaultAccount,
          gas: Math.floor(gasEstimate * 1.2),
        });

      return {
        success: true,
        txHash: tx.transactionHash,
      };
    } catch (error) {
      logger.error('Error storing document:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get the current document CID for a user and document type
   * @param {string} userId - User identifier
   * @param {string} docType - Document type
   * @returns {Promise<{success: boolean, ipfsCid?: string, version?: number, uploadedAt?: number, error?: string}>}
   */
  async getDocumentCid(userId, docType) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'DocumentStorage contract not available' };
    }

    try {
      const docTypeEnum = this.getDocumentType(docType);
      const result = await this.contract.methods.getDocumentCid(userId, docTypeEnum).call();

      return {
        success: true,
        ipfsCid: result.ipfsCid,
        version: Number(result.version),
        uploadedAt: Number(result.uploadedAt),
      };
    } catch (error) {
      logger.error('Error getting document CID:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get document history for a user and document type
   * @param {string} userId - User identifier
   * @param {string} docType - Document type
   * @returns {Promise<{success: boolean, cids?: string[], versions?: number[], timestamps?: number[], error?: string}>}
   */
  async getDocumentHistory(userId, docType) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return { success: false, error: 'DocumentStorage contract not available' };
    }

    try {
      const docTypeEnum = this.getDocumentType(docType);
      const result = await this.contract.methods.getDocumentHistory(userId, docTypeEnum).call();

      return {
        success: true,
        cids: result.cids,
        versions: result.versions.map(v => Number(v)),
        timestamps: result.timestamps.map(t => Number(t)),
      };
    } catch (error) {
      logger.error('Error getting document history:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check if a document exists for a user
   * @param {string} userId - User identifier
   * @param {string} docType - Document type
   * @returns {Promise<boolean>}
   */
  async documentExists(userId, docType) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      return false;
    }

    try {
      const docTypeEnum = this.getDocumentType(docType);
      const exists = await this.contract.methods.documentExists(userId, docTypeEnum).call();
      return exists;
    } catch (error) {
      logger.error('Error checking if document exists:', error);
      return false;
    }
  }
}

// Create singleton instance
const documentStorageService = new DocumentStorageService();

module.exports = documentStorageService;
