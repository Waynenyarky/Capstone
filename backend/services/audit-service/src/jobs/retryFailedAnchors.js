const AuditLog = require("../models/AuditLog");
const blockchainService = require("../lib/blockchainService");
const blockchainQueue = require("../lib/blockchainQueue");

const MAX_RETRY_AGE_HOURS = 72;

async function retryFailedAnchors() {
  if (!blockchainService.isAvailable()) return;

  const cutoff = new Date(Date.now() - MAX_RETRY_AGE_HOURS * 60 * 60 * 1000);

  const failedLogs = await AuditLog.find({
    blockchainStatus: { $in: ["failed", "skipped", "pending"] },
    txHash: { $in: ["", null] },
    createdAt: { $gte: cutoff },
  })
    .limit(50)
    .lean();

  for (const log of failedLogs) {
    if (log.hash) {
      blockchainQueue.queueBlockchainOperation(
        "logAuditHash",
        [log.hash, log.eventType],
        String(log._id),
      );
    }
  }

  if (failedLogs.length > 0) {
    console.log(
      `[retryFailedAnchors] Re-queued ${failedLogs.length} un-anchored audit logs`,
    );
  }
}

module.exports = retryFailedAnchors;
