/**
 * Optional virus/malware scanning for file uploads (IAS-2: Type + size + scanning).
 * When CLAMAV_HOST is set, scans files via ClamAV daemon; otherwise no-op.
 * Fail closed: on daemon error we treat as infected so upload is rejected.
 */

const path = require('path')
const fs = require('fs')

let clamd = null
let scanner = null

function getScanner() {
  if (scanner) return scanner
  const host = process.env.CLAMAV_HOST
  const port = Number(process.env.CLAMAV_PORT) || 3310
  if (!host || typeof host !== 'string' || !host.trim()) return null
  try {
    clamd = require('clamdjs')
    scanner = clamd.createScanner(host.trim(), port)
    return scanner
  } catch (err) {
    console.warn('[fileScan] clamdjs not installed or config invalid:', err.message)
    return null
  }
}

function isScanConfigured() {
  return Boolean(process.env.CLAMAV_HOST && String(process.env.CLAMAV_HOST).trim())
}

/**
 * Scan a file at the given path. When ClamAV is not configured, resolves with { clean: true }.
 * When configured, runs the scan; on virus or daemon error returns { clean: false, error? }.
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<{ clean: boolean, error?: string }>}
 */
async function scanFile(filePath) {
  if (!isScanConfigured()) {
    return { clean: true }
  }
  const normalizedPath = path.normalize(filePath)
  try {
    const stat = await fs.promises.stat(normalizedPath)
    if (!stat.isFile()) {
      return { clean: false, error: 'not_a_file' }
    }
  } catch (err) {
    return { clean: false, error: err.code || 'file_error' }
  }

  const sc = getScanner()
  if (!sc || !clamd) {
    return { clean: true }
  }

  try {
    const timeout = Math.min(30000, Number(process.env.CLAMAV_SCAN_TIMEOUT_MS) || 10000)
    const reply = await sc.scanFile(normalizedPath, timeout)
    const clean = clamd.isCleanReply(reply)
    return clean ? { clean: true } : { clean: false, error: 'infected' }
  } catch (err) {
    return { clean: false, error: err.message || 'scan_error' }
  }
}

module.exports = { scanFile, isScanConfigured }
