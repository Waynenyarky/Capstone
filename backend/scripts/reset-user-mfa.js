#!/usr/bin/env node
/**
 * Reset MFA state for any user (admin or staff) by email so they can log in again.
 * Use when a seed/demo account is locked out (403 "Multi-factor authentication required").
 *
 * Usage (from repo root):
 *   node backend/scripts/reset-user-mfa.js <email>
 *
 * Examples:
 *   node backend/scripts/reset-user-mfa.js staff@example.com
 *   node backend/scripts/reset-user-mfa.js admin@example.com
 *
 * Requires MongoDB in .env (MONGODB_URI or MONGO_URI).
 */

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const mongoose = require('mongoose')

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node backend/scripts/reset-user-mfa.js <email>')
    process.exit(1)
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Set MONGODB_URI or MONGO_URI in .env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const User = require('../services/auth-service/src/models/User')

  const emailKey = String(email).trim().toLowerCase()
  const user = await User.findOne({
    $or: [
      { email: emailKey },
      ...(emailKey === '1' ? [{ email: '1' }] : []),
    ],
  })

  if (!user) {
    console.error('No user found for:', email)
    await mongoose.disconnect()
    process.exit(1)
  }

  user.mfaSecret = undefined
  user.mfaEnabled = false
  user.mfaMethod = ''
  user.mustSetupMfa = true
  // Clear passkeys so they can use email OTP in dev/demo
  user.webauthnCredentials = []
  await user.save()

  console.log('MFA reset for:', user.email)
  console.log('They can log in again; in dev/demo they will get email OTP.')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
