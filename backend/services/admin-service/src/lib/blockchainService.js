/**
 * Blockchain Service (Stub for Admin Service)
 * Admin service doesn't directly interact with blockchain
 * Audit service handles blockchain operations
 */

let isInitialized = false

async function initialize() {
  isInitialized = true
  return true
}

function isAvailable() {
  return false // Admin service doesn't use blockchain directly
}

module.exports = {
  initialize,
  isAvailable,
}