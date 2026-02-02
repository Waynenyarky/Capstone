#!/usr/bin/env node
/**
 * Verify an Inspector account's password - for debugging login issues.
 * Usage: node scripts/verify-inspector-password.js <email> <password>
 */

const path = require('path')
const fs = require('fs')

const backendEnv = path.join(__dirname, '..', '.env')
const rootEnv = path.join(__dirname, '..', '..', '.env')
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv })
} else if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv })
} else {
  require('dotenv').config()
}

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

async function main() {
  const [email, password] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: node scripts/verify-inspector-password.js <email> <password>')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
  if (!uri) {
    console.error('Error: MONGO_URI not set in .env')
    process.exit(1)
  }

  console.log('MONGO_URI:', uri.replace(/:[^:@]+@/, ':****@'))
  await mongoose.connect(uri)

  const User = require('../src/models/User')
  const Role = require('../src/models/Role')

  const emailKey = email.trim().toLowerCase()
  const doc = await User.findOne({ email: emailKey }).populate('role').lean()
  if (!doc) {
    console.log('User NOT FOUND:', emailKey)
    await mongoose.disconnect()
    process.exit(1)
  }

  const roleSlug = doc.role?.slug || 'unknown'
  const match = doc.passwordHash && await bcrypt.compare(password, doc.passwordHash)
  console.log('User found:', emailKey)
  console.log('Role:', roleSlug)
  console.log('Password matches:', match ? 'YES' : 'NO')
  await mongoose.disconnect()
  process.exit(match ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
