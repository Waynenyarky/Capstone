/**
 * Blockchain Service (Stub for Business Service)
 * Business service doesn't directly interact with blockchain
 * Audit service handles blockchain operations
 */

let isInitialized = false

async function initialize() {
  isInitialized = true
  return true
}

function isAvailable() {
  return false // Business service doesn't use blockchain directly
}

module.exports = {
  initialize,
  isAvailable,
}
