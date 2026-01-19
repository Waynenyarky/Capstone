/**
 * Blockchain Queue Service
 * Queues blockchain operations to avoid blocking user requests
 * Implements retry logic for failed operations
 */

const blockchainService = require('./blockchainService')
const AuditLog = require('../models/AuditLog')

// In-memory queue for blockchain operations
const queue = []
let processing = false
let shouldStop = false // Flag to stop processing (for cleanup)
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000 // 5 seconds

/**
 * Add operation to blockchain queue
 * @param {string} operation - Operation type ('logAuditHash', 'logCriticalEvent', 'logAdminApproval')
 * @param {Array} args - Arguments for the operation
 * @param {string} auditLogId - Optional audit log ID to update
 */
function queueBlockchainOperation(operation, args, auditLogId = null) {
  queue.push({
    operation,
    args,
    auditLogId,
    retries: 0,
    timestamp: Date.now(),
  })

  // Start processing if not already processing
  if (!processing) {
    processQueue()
  }
}

/**
 * Process the blockchain queue
 */
async function processQueue() {
  if (processing || queue.length === 0 || shouldStop) {
    return
  }

  processing = true

  while (queue.length > 0 && !shouldStop) {
    const item = queue.shift()

    try {
      let result

      switch (item.operation) {
        case 'logAuditHash':
          result = await blockchainService.logAuditHash(item.args[0], item.args[1])
          break
        case 'logCriticalEvent':
          result = await blockchainService.logCriticalEvent(item.args[0], item.args[1], item.args[2])
          break
        case 'logAdminApproval':
          // logAdminApproval(approvalId, eventType, userId, approverId, approved, details)
          result = await blockchainService.logAdminApproval(
            item.args[0], // approvalId
            item.args[1], // eventType
            item.args[2], // userId
            item.args[3] || '', // approverId (optional)
            item.args[4] !== undefined ? item.args[4] : true, // approved (default true)
            item.args[5] || '' // details
          )
          break
        default:
          console.error('Unknown blockchain operation:', item.operation)
          continue
      }

      if (result.success) {
        // Update audit log if ID provided
        if (item.auditLogId) {
          await AuditLog.findByIdAndUpdate(item.auditLogId, {
            txHash: result.txHash,
            blockNumber: result.blockNumber,
          }).catch((err) => {
            console.error('Failed to update audit log with blockchain data:', err)
          })
        }
      } else {
        // Retry if failed
        if (item.retries < MAX_RETRIES && !shouldStop) {
          item.retries++
          queue.push(item) // Re-add to queue
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        } else {
          console.error(`Blockchain operation failed after ${MAX_RETRIES} retries:`, {
            operation: item.operation,
            error: result.error,
            auditLogId: item.auditLogId,
          })
        }
      }
    } catch (error) {
      console.error('Error processing blockchain queue item:', error)
      
      // Retry on error
      if (item.retries < MAX_RETRIES && !shouldStop) {
        item.retries++
        queue.push(item) // Re-add to queue
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      } else {
        console.error(`Blockchain operation failed after ${MAX_RETRIES} retries:`, {
          operation: item.operation,
          error: error.message,
          auditLogId: item.auditLogId,
        })
      }
    }
  }

  processing = false
}

/**
 * Get queue status
 * @returns {object} - Queue status information
 */
function getQueueStatus() {
  return {
    queueLength: queue.length,
    processing,
    items: queue.map((item) => ({
      operation: item.operation,
      retries: item.retries,
      timestamp: item.timestamp,
    })),
  }
}

/**
 * Clear queue (for testing/admin purposes)
 */
function clearQueue() {
  queue.length = 0
  processing = false
}

/**
 * Cleanup: Stop processing and clear queue
 * Should be called in tests to prevent Jest from hanging
 */
function cleanup() {
  shouldStop = true
  queue.length = 0
  processing = false
  // Reset flag after a brief delay to allow current operations to finish
  setTimeout(() => {
    shouldStop = false
  }, 100)
}

module.exports = {
  queueBlockchainOperation,
  processQueue,
  getQueueStatus,
  clearQueue,
  cleanup,
}
