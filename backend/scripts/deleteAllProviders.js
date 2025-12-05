/*
 * One-off cleanup script: delete all provider accounts.
 * Removes all Provider documents and their associated User records (role: provider).
 * Usage: `node backend/scripts/deleteAllProviders.js`
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const Provider = require('../src/models/Provider')
const User = require('../src/models/User')

async function main() {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) {
      console.warn('MONGO_URI not set. Aborting deletion.')
      process.exit(1)
    }

    await connectDB(uri)
    if (mongoose.connection.readyState !== 1) {
      console.warn('Database not connected. Aborting deletion.')
      process.exit(1)
    }

    const providers = await Provider.find({}, { _id: 1, userId: 1 }).lean()
    const userIds = providers.map((p) => p.userId).filter(Boolean)

    const provRes = await Provider.deleteMany({})
    let userDeleted = 0
    if (userIds.length > 0) {
      const userRes = await User.deleteMany({ _id: { $in: userIds } })
      userDeleted = userRes?.deletedCount || 0
    }

    console.log(`Deleted providers: ${provRes?.deletedCount || 0}`)
    console.log(`Deleted provider users: ${userDeleted}`)
  } catch (err) {
    console.error('Deletion failed:', err)
    process.exit(1)
  } finally {
    try {
      await mongoose.disconnect()
    } catch (_) {}
  }
}

main()