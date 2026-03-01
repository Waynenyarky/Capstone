/**
 * IPFS Service
 * Handles file uploads and retrieval from IPFS
 * Supports local IPFS node or remote services (Pinata, Infura)
 * 
 * Note: Uses dynamic import to avoid module loading issues
 */

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
  if (initializationPromise) {
    return initializationPromise
  }
  
  initializationPromise = (async () => {
    try {
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

    if (provider === 'pinata') {
      const pinataApiKey = process.env.PINATA_API_KEY
      const pinataSecretKey = process.env.PINATA_SECRET_KEY
      
      if (!pinataApiKey || !pinataSecretKey) {
        getLogger().warn('IPFS: Pinata credentials not configured, using local node')
        ipfsClient = create({ url: apiUrl })
      } else {
        ipfsClient = create({
          url: 'https://api.pinata.cloud',
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        })
        getLogger().info('IPFS: Using Pinata provider')
      }
    } else if (provider === 'infura') {
      const infuraProjectId = process.env.INFURA_PROJECT_ID
      const infuraProjectSecret = process.env.INFURA_PROJECT_SECRET
      
      if (!infuraProjectId || !infuraProjectSecret) {
        getLogger().warn('IPFS: Infura credentials not configured, using local node')
        ipfsClient = create({ url: apiUrl })
      } else {
        const infuraUrl = `https://ipfs.infura.io:5001/api/v0`
        ipfsClient = create({
          url: infuraUrl,
          headers: {
            authorization: `Basic ${Buffer.from(`${infuraProjectId}:${infuraProjectSecret}`).toString('base64')}`
          }
        })
      }
    } else {
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
      pin: true,
      cidVersion: 1
    })

    const cid = result.cid.toString()
    const size = result.size || fileBuffer.length

    getLogger().info('File uploaded to IPFS', { cid, size, fileName })
    return { cid, size }
  } catch (error) {
    getLogger().error('Failed to upload file to IPFS', { error: error.message, fileName })
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
const IPFS_TIMEOUT_MS = parseInt(process.env.IPFS_TIMEOUT_MS, 10) || 30000
const IPFS_MAX_RETRIES = parseInt(process.env.IPFS_MAX_RETRIES, 10) || 3

async function getFile(cid) {
  if (!isAvailable()) {
    throw new Error('IPFS service is not available')
  }

  let lastError
  for (let attempt = 1; attempt <= IPFS_MAX_RETRIES; attempt++) {
    try {
      const chunks = []
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), IPFS_TIMEOUT_MS)
      try {
        for await (const chunk of ipfsClient.cat(cid, { signal: controller.signal })) {
          chunks.push(chunk)
        }
      } finally {
        clearTimeout(timeout)
      }

      const fileBuffer = Buffer.concat(chunks)
      getLogger().info('File retrieved from IPFS', { cid, size: fileBuffer.length, attempt })
      return fileBuffer
    } catch (error) {
      lastError = error
      getLogger().warn(`IPFS getFile attempt ${attempt}/${IPFS_MAX_RETRIES} failed`, { error: error.message, cid })
      if (attempt < IPFS_MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
      }
    }
  }
  getLogger().error('Failed to retrieve file from IPFS after retries', { error: lastError?.message, cid })
  throw lastError
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
    getLogger().info('File pinned to IPFS', { cid })
  } catch (error) {
    getLogger().error('Failed to pin file to IPFS', { error: error.message, cid })
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
