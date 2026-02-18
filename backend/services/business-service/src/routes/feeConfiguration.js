const express = require('express')
const FeeConfiguration = require('../models/FeeConfiguration')
const { requireJwt, requireRole } = require('../middleware/auth')

const router = express.Router()

/**
 * Validate bracket structure. For bracketKind 'fixed', amount is required; for 'rate'/'tiered', rate is required.
 * @param {Array} brackets
 * @param {string} bracketKind - 'rate' | 'tiered' | 'fixed'
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBrackets(brackets, bracketKind = 'rate') {
  const errors = []
  if (!Array.isArray(brackets)) return { valid: true, errors }

  const useFixed = bracketKind === 'fixed'

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]
    if (b.min == null) {
      errors.push(`Bracket ${i + 1}: min is required`)
      continue
    }
    if (b.min < 0) {
      errors.push(`Bracket ${i + 1}: min cannot be negative`)
    }
    if (useFixed) {
      if (b.amount == null) {
        errors.push(`Bracket ${i + 1}: amount is required when bracketKind is fixed`)
      }
      if (b.amount != null && b.amount < 0) {
        errors.push(`Bracket ${i + 1}: amount cannot be negative`)
      }
    } else {
      if (b.rate == null) {
        errors.push(`Bracket ${i + 1}: rate is required when bracketKind is rate or tiered`)
      } else if (b.rate < 0 || b.rate > 100) {
        errors.push(`Bracket ${i + 1}: rate must be between 0 and 100`)
      }
    }
    if (b.max != null && b.max < b.min) {
      errors.push(`Bracket ${i + 1}: max cannot be less than min`)
    }
  }

  // Check for overlapping brackets
  if (brackets.length > 1) {
    const sorted = [...brackets].sort((a, b) => a.min - b.min)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].max != null && sorted[i].min <= sorted[i - 1].max) {
        errors.push(`Brackets ${i} and ${i + 1} overlap`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// GET /api/business/admin/fee-configuration — list all configs
router.get('/', requireJwt, async (req, res) => {
  try {
    const configs = await FeeConfiguration.find().sort({ taxCode: 1, lineOfBusiness: 1 }).lean()
    return res.json({ data: configs })
  } catch (err) {
    console.error('GET /fee-configuration error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch fee configurations' } })
  }
})

// POST /api/business/admin/fee-configuration — create
router.post('/', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { taxCode, lineOfBusiness, mayorsPermitFee, businessTaxCategory, bracketKind, brackets } = req.body
    if (!lineOfBusiness || mayorsPermitFee == null) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'lineOfBusiness and mayorsPermitFee are required' },
      })
    }

    const kind = ['rate', 'tiered', 'fixed'].includes(bracketKind) ? bracketKind : 'rate'

    // Validate brackets if provided
    if (brackets && brackets.length > 0) {
      const bracketValidation = validateBrackets(brackets, kind)
      if (!bracketValidation.valid) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: bracketValidation.errors.join('; ') },
        })
      }
    }

    const config = await FeeConfiguration.create({
      taxCode: taxCode ? taxCode.toUpperCase().trim() : '',
      lineOfBusiness: lineOfBusiness.toLowerCase().trim(),
      mayorsPermitFee,
      businessTaxCategory: businessTaxCategory || '',
      bracketKind: kind,
      brackets: brackets || [],
      effectiveDate: new Date(),
      isActive: true,
    })
    return res.status(201).json({ data: config })
  } catch (err) {
    // Edge case UC-2C-6: Duplicate lineOfBusiness (unique index violation)
    if (err.code === 11000) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Fee configuration already exists for this line of business' },
      })
    }
    console.error('POST /fee-configuration error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create fee configuration' } })
  }
})

// PUT /api/business/admin/fee-configuration/:id — update
router.put('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { taxCode, lineOfBusiness, mayorsPermitFee, businessTaxCategory, bracketKind, brackets, isActive } = req.body
    const config = await FeeConfiguration.findById(id)
    if (!config) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Fee configuration not found' } })
    }

    const kind = bracketKind !== undefined
      ? (['rate', 'tiered', 'fixed'].includes(bracketKind) ? bracketKind : config.bracketKind)
      : config.bracketKind

    // Validate brackets if provided
    if (brackets && brackets.length > 0) {
      const bracketValidation = validateBrackets(brackets, kind)
      if (!bracketValidation.valid) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: bracketValidation.errors.join('; ') },
        })
      }
    }

    if (taxCode !== undefined) config.taxCode = taxCode ? taxCode.toUpperCase().trim() : ''
    if (lineOfBusiness) config.lineOfBusiness = lineOfBusiness.toLowerCase().trim()
    if (mayorsPermitFee != null) config.mayorsPermitFee = mayorsPermitFee
    if (businessTaxCategory !== undefined) config.businessTaxCategory = businessTaxCategory
    if (bracketKind !== undefined) config.bracketKind = kind
    if (brackets !== undefined) config.brackets = brackets
    if (isActive !== undefined) config.isActive = isActive

    await config.save()
    return res.json({ data: config })
  } catch (err) {
    console.error('PUT /fee-configuration error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update fee configuration' } })
  }
})

// DELETE /api/business/admin/fee-configuration/:id
router.delete('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const config = await FeeConfiguration.findById(req.params.id)
    if (!config) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
    }

    // Edge case UC-2C-5: Cannot delete if it's the only active config for this LOB
    // (soft-deactivate instead)
    if (config.isActive) {
      const otherActive = await FeeConfiguration.countDocuments({
        lineOfBusiness: config.lineOfBusiness,
        isActive: true,
        _id: { $ne: config._id },
      })
      if (otherActive === 0) {
        // Soft-deactivate instead of hard delete
        config.isActive = false
        await config.save()
        return res.json({
          data: { deactivated: true, message: 'Last active config for this line of business — deactivated instead of deleted' },
        })
      }
    }

    await config.deleteOne()
    return res.json({ data: { deleted: true } })
  } catch (err) {
    console.error('DELETE /fee-configuration error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to delete' } })
  }
})

module.exports = router
