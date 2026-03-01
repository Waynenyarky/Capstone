const fs = require('fs').promises

const MAGIC_BYTES = {
  'application/pdf': { offset: 0, bytes: Buffer.from('%PDF', 'ascii') },
  'application/msword': { offset: 0, bytes: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]) },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { offset: 0, bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]) },
  'application/vnd.ms-excel': { offset: 0, bytes: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]) },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { offset: 0, bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]) },
}

/**
 * Validate that a file on disk matches its declared MIME type
 * by checking leading magic bytes.
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - Declared MIME type
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateMagicBytes(filePath, mimeType) {
  const spec = MAGIC_BYTES[mimeType]
  if (!spec) {
    return { valid: true }
  }

  let handle
  try {
    handle = await fs.open(filePath, 'r')
    const buf = Buffer.alloc(spec.bytes.length)
    await handle.read(buf, 0, spec.bytes.length, spec.offset)
    await handle.close()

    const matches = buf.equals(spec.bytes)
    if (!matches) {
      return { valid: false, error: 'File content does not match declared file type' }
    }
    return { valid: true }
  } catch (err) {
    if (handle) await handle.close().catch(() => {})
    return { valid: false, error: 'Unable to read file for validation' }
  }
}

module.exports = { validateMagicBytes, MAGIC_BYTES }
