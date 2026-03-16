/**
 * Blockchain Queue Service
 * Queues blockchain operations to avoid blocking user requests
 * Implements retry logic for failed operations
 *
 * V3 MAINNET-$1K MODE: Supports epoch digest anchoring via digestService
 */

const blockchainService = require('./blockchainService')
const AuditLog = require('../models/AuditLog')
const gasPolicy = require('./gasPolicy')

const crypto = require('crypto')

// In-memory queue for blockchain operations
const queue = []
let processing = false
let shouldStop = false // Flag to stop processing (for cleanup)
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000 // 5 seconds

// Batch buffer for Tier B events (scheduled flush) - used in compact/batch modes
const batchBuffer = []
const BATCH_FLUSH_INTERVAL_MS = Number(process.env.BATCH_FLUSH_INTERVAL_MS) || 60000 // default 60s
let batchFlushTimer = null

// Digest anchor timer for mainnet_budget mode
let digestAnchorTimer = null
const DIGEST_ANCHOR_INTERVAL_MS = Number(process.env.DIGEST_ANCHOR_INTERVAL_MS) || 30000 // 30s check

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
          // V2: use adaptive method (auto-routes to compact if gas mode is not legacy)
          result = await blockchainService.logCriticalEventAdaptive(item.args[0], item.args[1], item.args[2])
          break
        case 'logAdminApproval':
          // V2: use adaptive method (auto-routes to compact if gas mode is not legacy)
          result = await blockchainService.logAdminApprovalAdaptive(
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
        if (item.auditLogId) {
          const update = {
            txHash: result.txHash,
            blockNumber: result.blockNumber != null ? Number(result.blockNumber) : null,
            blockchainStatus: 'anchored',
          };
          await AuditLog.findByIdAndUpdate(item.auditLogId, update).catch((err) => {
            console.error('Failed to update audit log with blockchain data:', err)
          })
        }
      } else {
        if (item.retries < MAX_RETRIES && !shouldStop) {
          item.retries++
          queue.push(item)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        } else {
          console.error(`Blockchain operation failed after ${MAX_RETRIES} retries:`, {
            operation: item.operation,
            error: result.error,
            auditLogId: item.auditLogId,
          })
          if (item.auditLogId) {
            await AuditLog.findByIdAndUpdate(item.auditLogId, {
              blockchainStatus: 'failed',
              blockchainError: result.error || 'Max retries exceeded',
              blockchainRetries: item.retries,
            }).catch(() => {})
          }
        }
      }
    } catch (error) {
      console.error('Error processing blockchain queue item:', error)
      
      if (item.retries < MAX_RETRIES && !shouldStop) {
        item.retries++
        queue.push(item)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      } else {
        console.error(`Blockchain operation failed after ${MAX_RETRIES} retries:`, {
          operation: item.operation,
          error: error.message,
          auditLogId: item.auditLogId,
        })
        if (item.auditLogId) {
          await AuditLog.findByIdAndUpdate(item.auditLogId, {
            blockchainStatus: 'failed',
            blockchainError: error.message || 'Exception during processing',
            blockchainRetries: item.retries,
          }).catch(() => {})
        }
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
 * Add an operation to the batch buffer (Tier B events).
 * These are flushed periodically as a single digest hash on-chain.
 * @param {string} operation - Operation type
 * @param {Array} args - Arguments for the operation
 * @param {string} auditLogId - Optional audit log ID to update
 */
function addToBatchBuffer(operation, args, auditLogId = null) {
  batchBuffer.push({
    operation,
    args,
    auditLogId,
    timestamp: Date.now(),
  })

  // Start flush timer if not already running
  if (!batchFlushTimer && !shouldStop) {
    startBatchFlushTimer()
  }
}

/**
 * Start the periodic batch flush timer.
 */
function startBatchFlushTimer() {
  if (batchFlushTimer) return
  batchFlushTimer = setInterval(() => {
    if (batchBuffer.length > 0 && !shouldStop) {
      flushBatchBuffer()
    }
  }, BATCH_FLUSH_INTERVAL_MS)
  // Allow process to exit even if timer is running
  if (batchFlushTimer.unref) batchFlushTimer.unref()
}

/**
 * Flush the batch buffer: compute a single digest hash from all buffered items
 * and submit one logAuditHash transaction instead of N individual ones.
 */
async function flushBatchBuffer() {
  if (batchBuffer.length === 0) return

  // Drain the buffer
  const items = batchBuffer.splice(0, batchBuffer.length)
  const auditLogIds = items.map(i => i.auditLogId).filter(Boolean)

  // Build digest: SHA256 of all individual hashes/payloads concatenated
  const digestInput = items.map(item => {
    if (item.operation === 'logAuditHash' && Array.isArray(item.args) && item.args[0]) {
      return item.args[0] // the hash itself
    }
    // For other operations, hash the args
    return crypto.createHash('sha256').update(JSON.stringify(item.args)).digest('hex')
  }).join('|')

  const digestHash = crypto.createHash('sha256').update(digestInput).digest('hex')
  const batchEventType = `batch_digest_${items.length}_events`

  // Queue the single digest as a normal Tier A operation
  queueBlockchainOperation('logAuditHash', [digestHash, batchEventType], null)

  // Mark all constituent audit logs as anchored via digest
  for (const id of auditLogIds) {
    await AuditLog.findByIdAndUpdate(id, {
      blockchainStatus: 'anchored_via_digest',
      batchDigestHash: digestHash,
    }).catch(() => {})
  }

  console.log(`[BlockchainQueue] Flushed batch: ${items.length} events → 1 digest tx (${digestHash.slice(0, 16)}...)`)
}

/**
 * Get batch buffer status
 */
function getBatchBufferStatus() {
  return {
    bufferLength: batchBuffer.length,
    flushIntervalMs: BATCH_FLUSH_INTERVAL_MS,
    timerActive: !!batchFlushTimer,
  }
}

// =========================================================================
// V3 MAINNET-$1K MODE: Epoch Digest Anchoring
// =========================================================================

/**
 * Add an event to the digest epoch buffer (mainnet_budget mode).
 * Uses digestService for epoch management.
 * @param {string} hash - The audit log hash
 * @param {string} auditLogId - The MongoDB _id of the AuditLog document
 */
function addToDigestEpoch(hash, auditLogId) {
  const digestService = require('./digestService')
  digestService.addToEpoch(hash, auditLogId)

  // Start digest anchor timer if not running
  if (!digestAnchorTimer && !shouldStop) {
    startDigestAnchorTimer()
  }
}

/**
 * Start the periodic digest anchor timer.
 * Checks for pending digests and anchors them.
 */
function startDigestAnchorTimer() {
  if (digestAnchorTimer) return

  digestAnchorTimer = setInterval(async () => {
    if (shouldStop) return
    await anchorPendingDigests()
  }, DIGEST_ANCHOR_INTERVAL_MS)

  // Allow process to exit
  if (digestAnchorTimer.unref) digestAnchorTimer.unref()
}

/**
 * Anchor pending digests to blockchain.
 */
async function anchorPendingDigests() {
  const digestService = require('./digestService')
  const pendingDigests = await digestService.getPendingDigests(5)

  for (const digest of pendingDigests) {
    if (shouldStop) break

    try {
      const result = await blockchainService.anchorDigestRoot(
        digest.digestRoot,
        digest.leafCount,
        digest.windowStart,
        digest.windowEnd,
        digest.digestType === 'merkle' ? 1 : 0
      )

      if (result.success) {
        await digestService.markAnchored(
          digest._id,
          result.txHash,
          result.blockNumber,
          result.gasUsed
        )
        console.log(`[BlockchainQueue] Digest ${digest._id} anchored: ${result.txHash}`)
      } else {
        await digestService.markFailed(digest._id, result.error)
      }
    } catch (err) {
      console.error(`[BlockchainQueue] Error anchoring digest ${digest._id}:`, err)
      await digestService.markFailed(digest._id, err.message)
    }
  }
}

/**
 * Get digest epoch status
 */
function getDigestEpochStatus() {
  const digestService = require('./digestService')
  return {
    ...digestService.getEpochStatus(),
    anchorTimerActive: !!digestAnchorTimer,
    anchorIntervalMs: DIGEST_ANCHOR_INTERVAL_MS,
  }
}

/**
 * Force flush digest epoch (for testing/admin)
 */
async function forceFlushDigestEpoch() {
  const digestService = require('./digestService')
  return digestService.forceFlush()
}

/**
 * Cleanup: Stop processing and clear queue
 * Should be called in tests to prevent Jest from hanging
 */
function cleanup() {
  shouldStop = true
  queue.length = 0
  batchBuffer.length = 0
  processing = false
  if (batchFlushTimer) {
    clearInterval(batchFlushTimer)
    batchFlushTimer = null
  }
  if (digestAnchorTimer) {
    clearInterval(digestAnchorTimer)
    digestAnchorTimer = null
  }
  // Cleanup digestService
  try {
    const digestService = require('./digestService')
    digestService.cleanup()
  } catch (e) { /* ignore */ }
  // Reset flag after a brief delay to allow current operations to finish
  setTimeout(() => {
    shouldStop = false
  }, 100)
}

module.exports = {
  queueBlockchainOperation,
  addToBatchBuffer,
  flushBatchBuffer,
  startBatchFlushTimer,
  processQueue,
  getQueueStatus,
  getBatchBufferStatus,
  clearQueue,
  cleanup,
  // V3 mainnet_budget mode
  addToDigestEpoch,
  startDigestAnchorTimer,
  anchorPendingDigests,
  getDigestEpochStatus,
  forceFlushDigestEpoch,
}
