/*
 * One-off migration: set offering.status='active' where offering.active=true
 * and the provider is approved and account not inactive/deleted/rejected.
 * Usage: `node backend/scripts/fixOfferingStatuses.js`
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const Provider = require('../src/models/Provider')
const ProviderServiceOffering = require('../src/models/ProviderServiceOffering')

async function main() {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) {
      console.error('MONGO_URI not set in backend/.env. Please configure your DB connection.')
      process.exit(1)
    }
    await connectDB(uri)
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Check MONGO_URI and connectivity.')
      process.exit(1)
    }

    const providers = await Provider.find({ applicationStatus: 'approved', status: { $nin: ['inactive','deleted','deletion_pending','rejected'] } }, { _id: 1 }).lean()
    const providerIds = providers.map((p) => p._id)
    console.log(`Approved/active providers: ${providerIds.length}`)

    const toFix = await ProviderServiceOffering.find({ providerId: { $in: providerIds }, active: true, status: { $ne: 'active' } }, { _id: 1, status: 1 }).lean()
    console.log(`Offerings to update: ${toFix.length}`)
    if (toFix.length === 0) {
      console.log('No offerings require status update.')
      return
    }
    const ids = toFix.map((o) => o._id)
    const res = await ProviderServiceOffering.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } })
    console.log(`Updated offerings: matched=${res.matchedCount || res.n || 0} modified=${res.modifiedCount || res.nModified || 0}`)
  } catch (err) {
    console.error('Status fix failed:', err)
    process.exit(1)
  } finally {
    try { await mongoose.disconnect() } catch (_) {}
  }
}

main()