const express = require('express')
const RegulatoryFeeConfig = require('../models/RegulatoryFeeConfig')
const { requireJwt, requireRole } = require('../middleware/auth')

const router = express.Router()
const ID = RegulatoryFeeConfig.SINGLETON_ID

/** Ensure the singleton document exists with defaults. */
async function ensureConfig() {
  let doc = await RegulatoryFeeConfig.findById(ID).lean()
  if (doc) return doc
  await RegulatoryFeeConfig.create({ _id: ID })
  doc = await RegulatoryFeeConfig.findById(ID).lean()
  return doc
}

// GET /api/business/admin/regulatory-fee-config
router.get('/', requireJwt, async (req, res) => {
  try {
    const config = await ensureConfig()
    return res.json({ data: config })
  } catch (err) {
    console.error('GET /regulatory-fee-config error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to fetch regulatory fee config' },
    })
  }
})

// PUT /api/business/admin/regulatory-fee-config
router.put('/', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { sanitaryBrackets, sanitaryHouseForRentFee, fireSafetyRate, fireSafetyMin } = req.body

    const update = {}
    if (Array.isArray(sanitaryBrackets)) {
      const valid = sanitaryBrackets.every(
        (b) => b && typeof b.minSqm === 'number' && typeof b.fee === 'number'
      )
      if (valid) update.sanitaryBrackets = sanitaryBrackets
    }
    if (typeof sanitaryHouseForRentFee === 'number' && sanitaryHouseForRentFee >= 0) {
      update.sanitaryHouseForRentFee = sanitaryHouseForRentFee
    }
    if (typeof fireSafetyRate === 'number' && fireSafetyRate >= 0 && fireSafetyRate <= 1) {
      update.fireSafetyRate = fireSafetyRate
    }
    if (typeof fireSafetyMin === 'number' && fireSafetyMin >= 0) {
      update.fireSafetyMin = fireSafetyMin
    }

    const config = await RegulatoryFeeConfig.findByIdAndUpdate(
      ID,
      { $set: update },
      { new: true, upsert: true }
    ).lean()

    return res.json({ data: config })
  } catch (err) {
    console.error('PUT /regulatory-fee-config error:', err)
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Failed to update regulatory fee config' },
    })
  }
})

module.exports = router
