const crypto = require('crypto')

function keyFromHash(hash) {
  return crypto.createHash('sha256').update(String(hash)).digest()
}

function encryptWithHash(hash, plain) {
  const key = keyFromHash(hash)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

function decryptWithHash(hash, value) {
  const s = String(value || '')
  if (!s.startsWith('enc:v1:')) return s
  const parts = s.split(':')
  const ivHex = parts[2] || ''
  const tagHex = parts[3] || ''
  const ctHex = parts[4] || ''
  const key = keyFromHash(hash)
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ct = Buffer.from(ctHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const out = Buffer.concat([decipher.update(ct), decipher.final()])
  return out.toString('utf8')
}

module.exports = { encryptWithHash, decryptWithHash }

