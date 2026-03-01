const express = require('express')
const Appeal = require('../models/Appeal')
const { requireJwt } = require('../middleware/auth')
const { logAuditEvent } = require('../lib/auditClient')

const router = express.Router()

// GET /api/business/appeals
router.get('/', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query
    let filter = {}
    // Staff sees all; owner sees only their own
    if (role !== 'staff' && req._userRole === 'business_owner') {
      filter.requestedBy = req._userId
    }
    if (status) filter.status = status
    const skip = (Number(page) - 1) * Number(limit)
    const [appeals, total] = await Promise.all([
      Appeal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Appeal.countDocuments(filter),
    ])
    return res.json({ data: appeals, meta: { page: Number(page), limit: Number(limit), total } })
  } catch (err) {
    console.error('GET /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch appeals' } })
  }
})

// POST /api/business/appeals — submit appeal
router.post('/', requireJwt, async (req, res) => {
  try {
    const { businessId, appealType, description, evidence, violationId, inspectionId } = req.body

    // Validation
    if (!appealType || !description) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'appealType and description are required' },
      })
    }

    if (!businessId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'businessId is required' },
      })
    }

    // Validate appealType is a known type
    const validTypes = ['wrong_fees', 'wrong_violations', 'wrong_assessment', 'other']
    if (!validTypes.includes(appealType)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid appealType. Must be one of: ${validTypes.join(', ')}`,
        },
      })
    }

    // Edge case UC-2K-4: Check for duplicate open appeal on same business/type
    const existingFilter = {
      businessId,
      appealType,
      status: { $in: ['submitted', 'under_review'] },
    }
    // Also check for duplicate by violationId if provided
    if (violationId) {
      existingFilter.violationId = violationId
    }
    const existing = await Appeal.findOne(existingFilter)
    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_APPEAL', message: 'An open appeal already exists for this business and type' },
      })
    }

    const appeal = await Appeal.create({
      businessId,
      appealType,
      description,
      evidence: evidence || [],
      violationId: violationId || undefined,
      inspectionId: inspectionId || undefined,
      requestedBy: req._userId,
      status: 'submitted',
    })
    logAuditEvent('appeal_submitted', req._userId, 'Appeal', appeal._id.toString(), { businessId: appeal.businessId })
    return res.status(201).json({ data: appeal })
  } catch (err) {
    console.error('POST /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit appeal' } })
  }
})

// PUT /api/business/appeals/:id — resolve (LGU Manager)
router.put('/:id', requireJwt, async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
    if (!appeal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appeal not found' } })
    }

    // Cannot update already resolved appeals
    if (appeal.status === 'approved' || appeal.status === 'rejected') {
      return res.status(400).json({
        error: { code: 'ALREADY_RESOLVED', message: 'This appeal has already been resolved' },
      })
    }

    const { status, resolution } = req.body
    if (status) {
      appeal.status = status
      if (status === 'approved' || status === 'rejected') {
        appeal.reviewedBy = req._userId
        appeal.resolution = resolution || ''
        appeal.resolvedAt = new Date()
      }
    }
    await appeal.save()
    logAuditEvent('appeal_resolved', req._userId, 'Appeal', appeal._id.toString(), { status: appeal.status })
    return res.json({ data: appeal })
  } catch (err) {
    console.error('PUT /appeals error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update appeal' } })
  }
})

module.exports = router
