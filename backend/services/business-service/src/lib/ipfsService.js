/**
 * IPFS Service Stub
 * Provides a stub implementation that doesn't load ipfs-http-client
 * This prevents module loading errors
 */

const logger = require('./logger')

let ipfsClient = null
let isInitialized = false

/**
 * Initialize IPFS client (stub - always returns false)
 */
async function initialize() {
  logger.warn('IPFS service is disabled in business-service (using stub)')
  isInitialized = false
  return false
}

/**
 * Check if IPFS is available
 */
function isAvailable() {
  return false
}

/**
 * Upload file to IPFS (stub)
 */
async function uploadFile(fileBuffer, fileName = '') {
  throw new Error('IPFS service not available in business-service')
}

/**
 * Upload JSON data to IPFS (stub)
 */
async function uploadJSON(data) {
  throw new Error('IPFS service not available in business-service')
}

/**
 * Get file from IPFS (stub)
 */
async function getFile(cid) {
  throw new Error('IPFS service not available in business-service')
}

/**
 * Pin file to IPFS (stub)
 */
async function pinFile(cid) {
  throw new Error('IPFS service not available in business-service')
}

/**
 * Unpin file from IPFS (stub)
 */
async function unpinFile(cid) {
  throw new Error('IPFS service not available in business-service')
}

/**
 * Get IPFS gateway URL for a CID
 */
function getGatewayUrl(cid) {
  const gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080/ipfs/'
  return `${gatewayUrl}${cid}`
}

module.exports = {
  initialize,
  isAvailable,
  uploadFile,
  uploadJSON,
  getFile,
  pinFile,
  unpinFile,
  getGatewayUrl
}
