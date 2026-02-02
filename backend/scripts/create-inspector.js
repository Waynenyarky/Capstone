#!/usr/bin/env node
/**
 * Create an Inspector account via terminal.
 * Usage: node scripts/create-inspector.js <email> <firstName> <lastName> <password>
 * Example: node scripts/create-inspector.js inspector2@example.com "John" "Inspector" "SecurePass123!"
 *
 * Requires: MONGO_URI or MONGODB_URI in .env (or environment)
 */

const path = require('path')
const fs = require('fs')

// Load .env from backend or root
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
  const args = process.argv.slice(2)
  if (args.length < 4) {
    console.error('Usage: node scripts/create-inspector.js <email> <firstName> <lastName> <password>')
    console.error('Example: node scripts/create-inspector.js inspector2@example.com "John" "Inspector" "SecurePass123!"')
    process.exit(1)
  }

  const [email, firstName, lastName, password] = args
  const emailKey = email.trim().toLowerCase()

  if (!emailKey.includes('@')) {
    console.error('Error: Invalid email address')
    process.exit(1)
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || ''
  if (!uri) {
    console.error('Error: MONGO_URI or MONGODB_URI not set. Add to .env or set in environment.')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }

  try {
    const User = require('../src/models/User')
    const Role = require('../src/models/Role')

    const roleDoc = await Role.findOne({ slug: 'inspector' })
    if (!roleDoc) {
      console.error('Error: Inspector role not found. Run seed first (SEED_DEV=true) or create the role.')
      await mongoose.disconnect()
      process.exit(1)
    }

    const existing = await User.findOne({ email: emailKey })
    if (existing) {
      // Update existing user to inspector role
      existing.role = roleDoc._id
      existing.firstName = firstName.trim()
      existing.lastName = lastName.trim()
      existing.passwordHash = await bcrypt.hash(password, 10)
      existing.isStaff = false  // Inspector uses email OTP, not MFA
      existing.isActive = true
      existing.mustChangeCredentials = false
      await existing.save()
      console.log(`Updated existing user to Inspector: ${emailKey}`)
    } else {
      const passwordHash = await bcrypt.hash(password, 10)
      const phoneNumber = `+${Date.now().toString().slice(-10)}` // Unique placeholder
      await User.create({
        email: emailKey,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber,
        role: roleDoc._id,
        passwordHash,
        termsAccepted: true,
        isStaff: false,  // Inspector uses email OTP, not MFA
        isActive: true,
        mustChangeCredentials: false,
        mustSetupMfa: false,
      })
      console.log(`Created Inspector account: ${emailKey}`)
    }

    console.log('')
    console.log('Inspector account ready:')
    console.log(`  Email: ${emailKey}`)
    console.log(`  Name: ${firstName.trim()} ${lastName.trim()}`)
    console.log(`  Password: (as provided)`)
    console.log('')
    console.log('The user must change password on first login.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()
