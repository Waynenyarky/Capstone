/**
 * Blockchain Queue (Stub for Business Service)
 * Business service doesn't directly queue blockchain operations
 */

function queueBlockchainOperation(operation, params, id) {
  // Stub - business service doesn't queue blockchain operations
  // Audit service handles this
  return null
}

module.exports = {
  queueBlockchainOperation,
}
