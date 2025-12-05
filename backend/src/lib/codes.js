const crypto = require('crypto')

function generateCode() {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex')
}

module.exports = { generateCode, generateToken }