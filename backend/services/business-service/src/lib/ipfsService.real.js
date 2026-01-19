/**
 * IPFS Service
 * Handles file uploads and retrieval from IPFS
 * Supports local IPFS node or remote services (Pinata, Infura)
 * 
 * Note: Uses dynamic import to avoid module loading issues
 */

// Lazy load logger to avoid circular dependencies
let logger = null
function getLogger() {
  if (!logger) {
    logger = require('./logger')
  }
  return logger
}

let ipfsClient = null
let isInitialized = false
let ipfsModule = null
let initializationPromise = null

/**
 * Initialize IPFS client
 */
async function initialize() {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise
  }
  
  initializationPromise = (async () => {
    try {
      // Dynamic import for ES module - wrap in try/catch to handle gracefully
      if (!ipfsModule) {
        try {
          ipfsModule = await import('ipfs-http-client')
        } catch (importError) {
          getLogger().warn('Failed to import ipfs-http-client, IPFS features disabled', { error: importError.message })
          isInitialized = false
          return false
        }
      }
      const { create } = ipfsModule.default || ipfsModule
    
    const provider = process.env.IPFS_PROVIDER || 'local'
    const apiUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001'
    const gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080/ipfs/'

    if (provider === 'pinata') {
      // Pinata IPFS service
      const pinataApiKey = process.env.PINATA_API_KEY
      const pinataSecretKey = process.env.PINATA_SECRET_KEY
      
      if (!pinataApiKey || !pinataSecretKey) {
        getLogger().warn('IPFS: Pinata credentials not configured, using local node')
        ipfsClient = create({ url: apiUrl })
      } else {
        // Pinata uses their own API, not standard IPFS HTTP client
        // For now, fallback to local node
        getLogger().warn('IPFS: Pinata integration not yet implemented, using local node')
        ipfsClient = create({ url: apiUrl })
      }
    } else if (provider === 'infura') {
      // Infura IPFS service
      const infuraProjectId = process.env.INFURA_PROJECT_ID
      const infuraProjectSecret = process.env.INFURA_PROJECT_SECRET
      
      if (!infuraProjectId || !infuraProjectSecret) {
        getLogger().warn('IPFS: Infura credentials not configured, using local node')
        ipfsClient = create({ url: apiUrl })
      } else {
        // Infura IPFS endpoint
        const infuraUrl = `https://ipfs.infura.io:5001/api/v0`
        ipfsClient = create({
          url: infuraUrl,
          headers: {
            authorization: `Basic ${Buffer.from(`${infuraProjectId}:${infuraProjectSecret}`).toString('base64')}`
          }
        })
      }
    } else {
      // Local IPFS node (default)
      ipfsClient = create({ url: apiUrl })
    }

      isInitialized = true
      getLogger().info('IPFS service initialized', { provider, apiUrl })
      return true
    } catch (error) {
      getLogger().error('Failed to initialize IPFS service', { error: error.message })
      isInitialized = false
      return false
    } finally {
      initializationPromise = null
    }
  })()
  
  return initializationPromise
}

/**
 * Check if IPFS is available
 */
function isAvailable() {
  return isInitialized && ipfsClient !== null
}

/**
 * Upload file to IPFS
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Optional file name
 * @returns {Promise<{cid: string, size: number}>} IPFS CID and file size
 */
async function uploadFile(fileBuffer, fileName = '') {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  try {
    const result = await ipfsClient.add({
      path: fileName || `file-${Date.now()}`,
      content: fileBuffer
    }, {
      pin: true, // Pin the file to ensure it persists
      cidVersion: 1 // Use CIDv1 for better compatibility
    })

    const cid = result.cid.toString()
    const size = result.size || fileBuffer.length

    logger.info('File uploaded to IPFS', { cid, size, fileName })
    return { cid, size }
  } catch (error) {
    logger.error('Failed to upload file to IPFS', { error: error.message, fileName })
    throw error
  }
}

/**
 * Upload JSON data to IPFS
 * @param {object} data - JSON data to upload
 * @returns {Promise<{cid: string, size: number}>} IPFS CID and data size
 */
async function uploadJSON(data) {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  try {
    const jsonString = JSON.stringify(data)
    const jsonBuffer = Buffer.from(jsonString, 'utf8')
    
    const result = await ipfsClient.add({
      path: `data-${Date.now()}.json`,
      content: jsonBuffer
    }, {
      pin: true,
      cidVersion: 1
    })

    const cid = result.cid.toString()
    const size = result.size || jsonBuffer.length

    getLogger().info('JSON data uploaded to IPFS', { cid, size })
    return { cid, size }
  } catch (error) {
    getLogger().error('Failed to upload JSON to IPFS', { error: error.message })
    throw error
  }
}

/**
 * Get file from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Buffer>} File buffer
 */
async function getFile(cid) {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  try {
    const chunks = []
    for await (const chunk of ipfsClient.cat(cid)) {
      chunks.push(chunk)
    }
    
    const fileBuffer = Buffer.concat(chunks)
    getLogger().info('File retrieved from IPFS', { cid, size: fileBuffer.length })
    return fileBuffer
  } catch (error) {
    getLogger().error('Failed to retrieve file from IPFS', { error: error.message, cid })
    throw error
  }
}

/**
 * Pin file to IPFS (ensure persistence)
 * @param {string} cid - IPFS CID to pin
 * @returns {Promise<void>}
 */
async function pinFile(cid) {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  try {
    await ipfsClient.pin.add(cid)
    logger.info('File pinned to IPFS', { cid })
  } catch (error) {
    logger.error('Failed to pin file to IPFS', { error: error.message, cid })
    throw error
  }
}

/**
 * Unpin file from IPFS
 * @param {string} cid - IPFS CID to unpin
 * @returns {Promise<void>}
 */
async function unpinFile(cid) {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  try {
    await ipfsClient.pin.rm(cid)
    getLogger().info('File unpinned from IPFS', { cid })
  } catch (error) {
    getLogger().error('Failed to unpin file from IPFS', { error: error.message, cid })
    throw error
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS CID
 * @returns {string} Gateway URL
 */
function getGatewayUrl(cid) {
  const gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080/ipfs/'
  return `${gatewayUrl}${cid}`
}

// Don't auto-initialize - let the service initialize it explicitly
// This prevents module load errors from breaking the service

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
