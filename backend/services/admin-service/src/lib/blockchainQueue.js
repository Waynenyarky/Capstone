/**
 * Blockchain Queue (Stub for Admin Service)
 * Admin service doesn't directly queue blockchain operations
 */

function queueBlockchainOperation(operation, params, id) {
  // Stub - admin service doesn't queue blockchain operations
  // Audit service handles this
  return null
}

module.exports = {
  queueBlockchainOperation,
}