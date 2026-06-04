/**
 * Digest Service
 * Manages epoch digest creation, anchoring, and proof generation for mainnet-$1k mode.
 */

const crypto = require("crypto");
const AuditDigest = require("../models/AuditDigest");
const AuditLog = require("../models/AuditLog");
const logger = require("./logger");

// Default epoch window: 15 minutes
const DEFAULT_EPOCH_WINDOW_MS =
  Number(process.env.DIGEST_EPOCH_WINDOW_MS) || 15 * 60 * 1000;

// Max leaves per digest (to bound gas and proof size)
const MAX_LEAVES_PER_DIGEST = Number(process.env.DIGEST_MAX_LEAVES) || 500;

// In-memory epoch buffer
let epochBuffer = [];
let epochStartTime = null;
let epochFlushTimer = null;

/**
 * Add an audit event to the current epoch buffer
 * @param {string} hash - The audit log hash
 * @param {string} auditLogId - The MongoDB _id of the AuditLog document
 */
function addToEpoch(hash, auditLogId) {
  if (!epochStartTime) {
    epochStartTime = new Date();
    startEpochTimer();
  }

  epochBuffer.push({ hash, auditLogId, addedAt: new Date() });

  // Force flush if buffer exceeds max
  if (epochBuffer.length >= MAX_LEAVES_PER_DIGEST) {
    logger.info("[DigestService] Max leaves reached, forcing epoch flush");
    flushEpoch();
  }
}

/**
 * Start the epoch flush timer
 */
function startEpochTimer() {
  if (epochFlushTimer) return;

  epochFlushTimer = setTimeout(() => {
    if (epochBuffer.length > 0) {
      flushEpoch();
    }
    epochFlushTimer = null;
  }, DEFAULT_EPOCH_WINDOW_MS);

  // Allow process to exit
  if (epochFlushTimer.unref) epochFlushTimer.unref();
}

/**
 * Flush the current epoch buffer and create a digest
 * @returns {Promise<AuditDigest|null>}
 */
async function flushEpoch() {
  if (epochBuffer.length === 0) {
    return null;
  }

  const items = epochBuffer.splice(0, epochBuffer.length);
  const windowStart = epochStartTime;
  const windowEnd = new Date();
  epochStartTime = null;

  if (epochFlushTimer) {
    clearTimeout(epochFlushTimer);
    epochFlushTimer = null;
  }

  // Build hash chain: H(H(H(h1)|h2)|h3)...
  const leafHashes = items.map((i) => i.hash);
  const auditLogIds = items.map((i) => i.auditLogId).filter(Boolean);

  let chainHash = leafHashes[0];
  for (let i = 1; i < leafHashes.length; i++) {
    const combined = chainHash + "|" + leafHashes[i];
    chainHash = crypto.createHash("sha256").update(combined).digest("hex");
  }

  const digestRoot = chainHash;

  try {
    const digest = await AuditDigest.create({
      digestRoot,
      digestType: "hash_chain",
      leafCount: leafHashes.length,
      auditLogIds,
      leafHashes,
      windowStart,
      windowEnd,
      anchorStatus: "pending",
    });

    // Update all constituent AuditLogs with digest reference
    if (auditLogIds.length > 0) {
      await AuditLog.updateMany(
        { _id: { $in: auditLogIds } },
        {
          $set: {
            blockchainStatus: "pending_digest",
            digestId: digest._id,
          },
        },
      );
    }

    logger.info(
      `[DigestService] Created digest ${digest._id} with ${leafHashes.length} leaves`,
    );
    return digest;
  } catch (err) {
    logger.error("[DigestService] Failed to create digest:", err);
    // Re-add items to buffer for retry
    epochBuffer.unshift(...items);
    epochStartTime = windowStart;
    startEpochTimer();
    return null;
  }
}

/**
 * Mark a digest as anchored after successful blockchain tx
 * @param {string} digestId - The digest _id
 * @param {string} txHash - Blockchain transaction hash
 * @param {number} blockNumber - Block number
 * @param {number} gasUsed - Gas used for the tx
 */
async function markAnchored(digestId, txHash, blockNumber, gasUsed) {
  const digest = await AuditDigest.findByIdAndUpdate(
    digestId,
    {
      $set: {
        anchorStatus: "anchored",
        txHash,
        blockNumber,
        gasUsed,
      },
    },
    { new: true },
  );

  if (digest) {
    // Update all constituent AuditLogs
    await AuditLog.updateMany(
      { _id: { $in: digest.auditLogIds } },
      {
        $set: {
          blockchainStatus: "anchored_via_digest",
          digestTxHash: txHash,
        },
      },
    );
    logger.info(`[DigestService] Digest ${digestId} anchored: ${txHash}`);
  }

  return digest;
}

/**
 * Mark a digest anchor as failed
 * @param {string} digestId - The digest _id
 * @param {string} error - Error message
 */
async function markFailed(digestId, error) {
  const digest = await AuditDigest.findById(digestId);
  if (!digest) return null;

  const maxRetries = 3;
  const newRetries = digest.anchorRetries + 1;

  if (newRetries >= maxRetries) {
    await AuditDigest.findByIdAndUpdate(digestId, {
      $set: { anchorStatus: "failed", anchorError: error },
      $inc: { anchorRetries: 1 },
    });

    // Mark constituent logs as failed
    await AuditLog.updateMany(
      { _id: { $in: digest.auditLogIds } },
      {
        $set: {
          blockchainStatus: "failed",
          blockchainError: "Digest anchor failed",
        },
      },
    );

    logger.error(
      `[DigestService] Digest ${digestId} failed after ${maxRetries} retries: ${error}`,
    );
  } else {
    await AuditDigest.findByIdAndUpdate(digestId, {
      $set: { anchorStatus: "retrying", anchorError: error },
      $inc: { anchorRetries: 1 },
    });
    logger.warn(
      `[DigestService] Digest ${digestId} retry ${newRetries}/${maxRetries}: ${error}`,
    );
  }

  return digest;
}

/**
 * Get pending digests that need anchoring
 * @param {number} limit - Max digests to return
 */
async function getPendingDigests(limit = 10) {
  return AuditDigest.findPendingAnchors(limit);
}

/**
 * Get inclusion proof for an audit log
 * @param {string} auditLogId - The AuditLog _id
 */
async function getInclusionProof(auditLogId) {
  const auditLog = await AuditLog.findById(auditLogId).lean();
  if (!auditLog) return null;

  const digest = await AuditDigest.findByAuditLogId(auditLogId);
  if (!digest) return null;

  const proof = digest.getInclusionProof(auditLog.hash);
  return {
    auditLogId,
    hash: auditLog.hash,
    digestId: digest._id,
    digestRoot: digest.digestRoot,
    txHash: digest.txHash,
    blockNumber: digest.blockNumber,
    anchorStatus: digest.anchorStatus,
    proof,
  };
}

/**
 * Get epoch buffer status
 */
function getEpochStatus() {
  return {
    bufferLength: epochBuffer.length,
    epochStartTime,
    epochWindowMs: DEFAULT_EPOCH_WINDOW_MS,
    maxLeavesPerDigest: MAX_LEAVES_PER_DIGEST,
    timerActive: !!epochFlushTimer,
  };
}

/**
 * Force flush for testing/admin
 */
async function forceFlush() {
  return flushEpoch();
}

/**
 * Cleanup for tests
 */
function cleanup() {
  epochBuffer = [];
  epochStartTime = null;
  if (epochFlushTimer) {
    clearTimeout(epochFlushTimer);
    epochFlushTimer = null;
  }
}

module.exports = {
  addToEpoch,
  flushEpoch,
  markAnchored,
  markFailed,
  getPendingDigests,
  getInclusionProof,
  getEpochStatus,
  forceFlush,
  cleanup,
  DEFAULT_EPOCH_WINDOW_MS,
  MAX_LEAVES_PER_DIGEST,
};
