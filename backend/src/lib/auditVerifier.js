const AuditLog = require('../models/AuditLog');
const blockchainService = require('./blockchainService');

/**
 * Audit Verifier Utility
 * Provides functions to verify audit logs against blockchain
 */
class AuditVerifier {
  /**
   * Verify a single audit log against the blockchain
   * @param {string|ObjectId} auditLogId - MongoDB ID of the audit log
   * @returns {Promise<{verified: boolean, matches: boolean, error?: string, details?: object}>}
   */
  async verifyAuditLog(auditLogId) {
    try {
      const auditLog = await AuditLog.findById(auditLogId);
      if (!auditLog) {
        return {
          verified: false,
          matches: false,
          error: 'Audit log not found',
        };
      }

      // Verify hash matches current data
      const hashMatches = auditLog.verifyHash();
      if (!hashMatches) {
        return {
          verified: false,
          matches: false,
          error: 'Hash does not match current data (data may have been tampered)',
          details: {
            auditLogId: String(auditLog._id),
            calculatedHash: auditLog.hash,
          },
        };
      }

      // Verify hash exists on blockchain
      if (!auditLog.txHash) {
        return {
          verified: false,
          matches: false,
          error: 'No transaction hash found (not logged to blockchain)',
          details: {
            auditLogId: String(auditLog._id),
          },
        };
      }

      const blockchainResult = await blockchainService.verifyHash(auditLog.hash);
      if (blockchainResult.error) {
        return {
          verified: false,
          matches: false,
          error: `Blockchain verification failed: ${blockchainResult.error}`,
          details: {
            auditLogId: String(auditLog._id),
            hash: auditLog.hash,
          },
        };
      }

      if (!blockchainResult.exists) {
        return {
          verified: false,
          matches: false,
          error: 'Hash not found on blockchain',
          details: {
            auditLogId: String(auditLog._id),
            hash: auditLog.hash,
            txHash: auditLog.txHash,
          },
        };
      }

      // Update verified status if not already verified
      if (!auditLog.verified) {
        auditLog.verified = true;
        auditLog.verifiedAt = new Date();
        await auditLog.save();
      }

      return {
        verified: true,
        matches: true,
        details: {
          auditLogId: String(auditLog._id),
          hash: auditLog.hash,
          txHash: auditLog.txHash,
          blockNumber: auditLog.blockNumber,
          blockchainTimestamp: blockchainResult.timestamp,
        },
      };
    } catch (error) {
      console.error('Error verifying audit log:', error);
      return {
        verified: false,
        matches: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get audit history for a user
   * @param {string|ObjectId} userId - User ID
   * @param {object} options - Query options
   * @param {number} options.limit - Maximum number of records to return
   * @param {number} options.skip - Number of records to skip
   * @param {string} options.eventType - Filter by event type
   * @returns {Promise<{success: boolean, logs?: Array, total?: number, error?: string}>}
   */
  async getAuditHistory(userId, options = {}) {
    try {
      const logs = await AuditLog.getUserAuditHistory(userId, options);
      const total = await AuditLog.countDocuments({ userId });

      return {
        success: true,
        logs,
        total,
      };
    } catch (error) {
      console.error('Error getting audit history:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Verify chain integrity for multiple audit logs
   * @param {Array<string|ObjectId>} auditLogIds - Array of audit log IDs
   * @returns {Promise<{verified: number, failed: number, results: Array}>}
   */
  async verifyChainIntegrity(auditLogIds) {
    const results = [];
    let verified = 0;
    let failed = 0;

    for (const id of auditLogIds) {
      const result = await this.verifyAuditLog(id);
      results.push({
        auditLogId: String(id),
        ...result,
      });

      if (result.verified && result.matches) {
        verified++;
      } else {
        failed++;
      }
    }

    return {
      verified,
      failed,
      total: auditLogIds.length,
      results,
    };
  }

  /**
   * Verify all unverified audit logs for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<{verified: number, failed: number, results: Array}>}
   */
  async verifyUserUnverifiedLogs(userId) {
    try {
      const unverifiedLogs = await AuditLog.find({
        userId,
        verified: false,
        txHash: { $ne: '' },
      }).select('_id');

      if (unverifiedLogs.length === 0) {
        return {
          verified: 0,
          failed: 0,
          total: 0,
          results: [],
        };
      }

      const auditLogIds = unverifiedLogs.map((log) => log._id);
      return await this.verifyChainIntegrity(auditLogIds);
    } catch (error) {
      console.error('Error verifying user unverified logs:', error);
      return {
        verified: 0,
        failed: 0,
        total: 0,
        results: [],
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get verification statistics
   * @returns {Promise<{total: number, verified: number, unverified: number, notLogged: number}>}
   */
  async getVerificationStats() {
    try {
      const [total, verified, notLogged] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ verified: true }),
        AuditLog.countDocuments({ txHash: '' }),
      ]);

      const unverified = total - verified - notLogged;

      return {
        total,
        verified,
        unverified,
        notLogged,
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return {
        total: 0,
        verified: 0,
        unverified: 0,
        notLogged: 0,
        error: error.message || 'Unknown error',
      };
    }
  }
}

module.exports = new AuditVerifier();
