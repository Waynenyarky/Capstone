/**
 * IPFS URL Resolution Utility
 * Converts IPFS CIDs to displayable gateway URLs
 */

/**
 * Resolves an IPFS CID or URL to a displayable gateway URL
 * @param {string} url - IPFS CID, gateway URL, or regular URL
 * @returns {string|null} - Resolved URL or null if invalid
 */
export function resolveIpfsUrl(url) {
  if (!url || url.trim() === '') return null
  
  const trimmedUrl = url.trim()
  
  // If already a full URL (http/https), return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl
  }
  
  // Check if it's an IPFS CID (common patterns: Qm..., bafy..., bafk..., etc.)
  // IPFS CID v0: Qm[1-9A-HJ-NP-Za-km-z]{44}
  // IPFS CID v1: baf[a-z0-9]+ (base32 encoded)
  const ipfsCidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]+)$/
  
  if (ipfsCidPattern.test(trimmedUrl)) {
    // It's an IPFS CID, use backend proxy
    // Use window.location.origin for ngrok access, fallback to VITE_BACKEND_ORIGIN
    const backendOrigin = typeof window !== 'undefined' 
      ? window.location.origin 
      : (import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001')
    return `${backendOrigin}/api/ipfs/${trimmedUrl}`
  }
  
  // If relative path starting with /ipfs/, extract CID and use backend proxy
  if (trimmedUrl.startsWith('/ipfs/')) {
    const cid = trimmedUrl.replace(/^\/ipfs\//, '')
    const backendOrigin = typeof window !== 'undefined' 
      ? window.location.origin 
      : (import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001')
    return `${backendOrigin}/api/ipfs/${cid}`
  }
  
  // For other relative paths or unrecognized formats, return as-is
  // (let backend or other handlers process it)
  return trimmedUrl
}

/**
 * Resolves multiple IPFS URLs (for batch processing)
 * @param {string[]} urls - Array of URLs to resolve
 * @returns {string[]} - Array of resolved URLs
 */
export function resolveIpfsUrls(urls) {
  if (!Array.isArray(urls)) return []
  return urls.map(url => resolveIpfsUrl(url)).filter(Boolean)
}
