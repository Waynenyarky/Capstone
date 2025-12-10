const crypto = require('crypto')

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5)
    if (chunk.length < 5) break
    out += alphabet[parseInt(chunk, 2)]
  }
  return out
}

function base32Decode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const ch of String(str).toUpperCase()) {
    const idx = alphabet.indexOf(ch)
    if (idx < 0) continue
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes))
}

function otpauthUri({ issuer, account, secret, algorithm = 'SHA1', digits = 6, period = 30 }) {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({ secret, issuer, algorithm, digits: String(digits), period: String(period) })
  return `otpauth://totp/${label}?${params.toString()}`
}

function hotp({ secret, counter, digits = 6 }) {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  for (let i = 7; i >= 0; i--) {
    buf[i] = counter & 0xff
    counter = Math.floor(counter / 256)
  }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  const mod = 10 ** digits
  return String(code % mod).padStart(digits, '0')
}

function totp({ secret, time = Date.now(), period = 30, digits = 6 }) {
  const counter = Math.floor(time / 1000 / period)
  return hotp({ secret, counter, digits })
}

function verifyTotp({ secret, token, window = 1, period = 30, digits = 6 }) {
  const now = Date.now()
  for (let w = -window; w <= window; w++) {
    const t = totp({ secret, time: now + w * period * 1000, period, digits })
    if (t === String(token)) return true
  }
  return false
}

module.exports = { generateSecret, otpauthUri, totp, verifyTotp }
