const express = require('express')
const { getFeeConfig } = require('../lib/feeCalculator')
const router = express.Router()

router.get('/fee-preview', async (req, res) => {
  const { lob } = req.query
  if (!lob) return res.status(400).json({ error: { code: 'missing_lob', message: 'Line of business is required' } })

  try {
    const feeConfig = await getFeeConfig(lob)
    if (!feeConfig) return res.status(404).json({ error: { code: 'no_fee_config', message: 'No fee configuration found for this LOB' } })

    return res.json({
      data: {
        lineOfBusiness: feeConfig.lineOfBusiness,
        taxCode: feeConfig.taxCode || null,
        feeConfig,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: { code: 'fee_calc_error', message: err.message } })
  }
})

module.exports = router
