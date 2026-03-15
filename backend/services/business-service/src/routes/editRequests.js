const express = require('express')
const mongoose = require('mongoose')
const EditRequest = require('../models/EditRequest')
const BusinessProfile = require('../models/BusinessProfile')
const { requireJwt } = require('../middleware/auth')
const { logAuditEvent } = require('../lib/auditClient')

const router = express.Router()

// Helper: build query that matches either businessId or subdoc _id
function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || '')
  const clauses = [{ 'businesses.businessId': target }]
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ 'businesses._id': new mongoose.Types.ObjectId(target) })
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses }
}

// Allowed fields per Appendix K UC-2N-3
const ALLOWED_EDIT_FIELDS = [
  'address',
  'tradeName',
  'businessActivities',
  'capital',
  'contact',
  'businessName',
  'registeredBusinessName',
  'phoneNumber',
  'email',
]

// GET /api/business/edit-requests
router.get('/', requireJwt, async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query
    let filter = {}
    if (role !== 'staff' && req._userRole === 'business_owner') {
      filter.requestedBy = req._userId
    }
    const skip = (Number(page) - 1) * Number(limit)
    const [requests, total] = await Promise.all([
      EditRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      EditRequest.countDocuments(filter),
    ])
    return res.json({ data: requests, meta: { page: Number(page), limit: Number(limit), total } })
  } catch (err) {
    console.error('GET /edit-requests error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch edit requests' } })
  }
})

// POST /api/business/edit-requests — submit
router.post('/', requireJwt, async (req, res) => {
  try {
    const { businessId, fieldName, currentValue, requestedValue, reason, supportingDocuments } = req.body
    if (!businessId || !fieldName || !requestedValue) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'businessId, fieldName, and requestedValue are required' },
      })
    }

    // Reject if new value is identical to current value
    if (currentValue !== undefined && String(requestedValue).trim() === String(currentValue).trim()) {
      return res.status(400).json({
        error: { code: 'IDENTICAL_VALUE', message: 'The requested value is the same as the current value' },
      })
    }

    // Edge case UC-2N-3: Validate allowed fields
    if (!ALLOWED_EDIT_FIELDS.includes(fieldName)) {
      return res.status(400).json({
        error: {
          code: 'FIELD_NOT_EDITABLE',
          message: `Field "${fieldName}" is not editable. Allowed fields: ${ALLOWED_EDIT_FIELDS.join(', ')}`,
        },
      })
    }

    // Edge case UC-2N-6: Block duplicate pending EditRequest for same field
    const existingPending = await EditRequest.findOne({
      businessId,
      fieldName,
      status: 'pending',
    })
    if (existingPending) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_EDIT_REQUEST',
          message: `A pending edit request already exists for field "${fieldName}" on this business`,
        },
      })
    }

    const editRequest = await EditRequest.create({
      businessId,
      requestedBy: req._userId,
      fieldName,
      currentValue: currentValue || '',
      requestedValue,
      reason: reason || '',
      supportingDocuments: supportingDocuments || [],
      status: 'pending',
    })
    logAuditEvent('edit_request_submitted', req._userId, 'EditRequest', editRequest._id.toString(), { businessId })
    return res.status(201).json({ data: editRequest })
  } catch (err) {
    console.error('POST /edit-requests error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create edit request' } })
  }
})

// PUT /api/business/edit-requests/:id — approve / reject (officer)
router.put('/:id', requireJwt, async (req, res) => {
  try {
    const editRequest = await EditRequest.findById(req.params.id)
    if (!editRequest) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Edit request not found' } })
    }

    // Cannot update already resolved requests
    if (editRequest.status === 'approved' || editRequest.status === 'rejected') {
      return res.status(400).json({
        error: { code: 'ALREADY_RESOLVED', message: 'This edit request has already been resolved' },
      })
    }

    const { status, reviewNotes } = req.body
    if (status) {
      editRequest.status = status
      editRequest.reviewedBy = req._userId
      editRequest.reviewNotes = reviewNotes || ''
      editRequest.resolvedAt = new Date()
    }
    await editRequest.save()

    // When approved, apply the change to the actual BusinessProfile
    if (status === 'approved' && editRequest.fieldName && editRequest.requestedValue !== undefined) {
      try {
        const fieldPath = `businesses.$.${editRequest.fieldName}`
        const updateResult = await BusinessProfile.updateOne(
          buildBusinessLookupQuery(editRequest.businessId),
          {
            $set: {
              [fieldPath]: editRequest.requestedValue,
              'businesses.$.updatedAt': new Date(),
            },
          }
        )
        if (updateResult.modifiedCount > 0) {
          logAuditEvent('edit_request_applied', req._userId, 'BusinessProfile', editRequest.businessId, {
            fieldName: editRequest.fieldName,
            previousValue: editRequest.currentValue,
            newValue: editRequest.requestedValue,
            editRequestId: editRequest._id.toString(),
          })
        } else {
          console.warn('Edit request approved but BusinessProfile not updated — business may not exist:', editRequest.businessId)
        }
      } catch (applyErr) {
        console.error('Failed to apply approved edit to BusinessProfile:', applyErr)
      }
    }

    return res.json({ data: editRequest })
  } catch (err) {
    console.error('PUT /edit-requests error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update edit request' } })
  }
})

module.exports = router
