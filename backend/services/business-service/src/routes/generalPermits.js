const express = require('express')
const GeneralPermit = require('../models/GeneralPermit')
const { requireJwt, requireRole } = require('../middleware/auth')
const { GENERAL_PERMIT_CATEGORY_VALUES } = require('../../../../shared/constants/generalPermitCategories')

const router = express.Router()

// GET /api/business/general-permits — list user's general permits
router.get('/', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = { applicantId: req._userId }
    if (status) filter.status = status
    const skip = (Number(page) - 1) * Number(limit)
    const [permits, total] = await Promise.all([
      GeneralPermit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      GeneralPermit.countDocuments(filter),
    ])
    return res.json({ data: permits, meta: { page: Number(page), limit: Number(limit), total } })
  } catch (err) {
    console.error('GET /general-permits error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch general permits' } })
  }
})

// POST /api/business/general-permits — create application
router.post('/', requireJwt, async (req, res) => {
  try {
    const { permitCategory, requirements, businessPlateNo } = req.body
    if (!permitCategory) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'permitCategory is required' },
      })
    }

    // Edge case: Validate permitCategory is a known category
    if (GENERAL_PERMIT_CATEGORY_VALUES && !GENERAL_PERMIT_CATEGORY_VALUES.includes(permitCategory)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CATEGORY',
          message: `"${permitCategory}" is not a valid permit category. Valid categories: ${GENERAL_PERMIT_CATEGORY_VALUES.join(', ')}`,
        },
      })
    }

    // Edge case UC-2G-4: Check if requirements are configured for this category
    // If no requirements are provided and category typically requires them, warn
    if (!requirements || requirements.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_REQUIREMENTS',
          message: 'No requirements submitted. Please upload the required documents for this permit category.',
        },
      })
    }

    const permit = await GeneralPermit.create({
      permitCategory,
      requirements: requirements || [],
      businessPlateNo: businessPlateNo || '',
      applicantId: req._userId,
      status: 'submitted',
    })
    return res.status(201).json({ data: permit })
  } catch (err) {
    console.error('POST /general-permits error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create general permit' } })
  }
})

// PUT /api/business/general-permits/:id — update (officer approve/reject)
router.put('/:id', requireJwt, async (req, res) => {
  try {
    const permit = await GeneralPermit.findById(req.params.id)
    if (!permit) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'General permit not found' } })
    }

    // Cannot update already resolved permits
    if (permit.status === 'approved' || permit.status === 'rejected') {
      return res.status(400).json({
        error: { code: 'ALREADY_RESOLVED', message: 'This permit has already been resolved' },
      })
    }

    const { status } = req.body
    if (status) {
      permit.status = status
      if (status === 'approved') {
        permit.approvedBy = req._userId
        permit.issuedAt = new Date()
      }
    }
    await permit.save()
    return res.json({ data: permit })
  } catch (err) {
    console.error('PUT /general-permits error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update general permit' } })
  }
})

module.exports = router
