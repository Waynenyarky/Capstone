const express = require('express')
const FormDefinition = require('../models/FormDefinition')
const FormGroup = require('../models/FormGroup')

const router = express.Router()

/**
 * GET /api/forms/active
 * Public endpoint to get the active (published) form definition for given criteria
 * 
 * Query params:
 * - type: 'registration' | 'permit' | 'renewal' | 'cessation' | 'violation' | 'appeal' (required)
 * - businessType: business type enum value (optional)
 * - lgu: LGU code (optional)
 */
router.get('/active', async (req, res) => {
  try {
    const { type, businessType, lgu } = req.query

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'type_required',
        message: 'Form type is required (registration, permit, renewal, cessation, violation, or appeal)',
      })
    }

    const validTypes = ['registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_type',
        message: `Form type must be one of: ${validTypes.join(', ')}`,
      })
    }

    // Use the model's static method for specificity-based resolution
    const definition = await FormDefinition.findActiveDefinition(type, businessType, lgu)

    if (!definition) {
      return res.status(404).json({
        success: false,
        error: 'no_active_definition',
        message: `No active form definition found for type: ${type}`,
      })
    }

    // Check if form group is deactivated
    if (definition.formGroupId) {
      const group = await FormGroup.findById(definition.formGroupId).lean()
      if (group?.deactivatedUntil) {
        const now = new Date()
        if (new Date(group.deactivatedUntil) > now) {
          return res.json({
            success: true,
            deactivated: true,
            availableAt: group.deactivatedUntil,
            reason: group.deactivateReason || 'This form is temporarily unavailable.',
          })
        }
      }
    }

    // Return the definition (without sensitive admin fields)
    return res.json({
      success: true,
      definition: {
        _id: definition._id,
        formType: definition.formType,
        version: definition.version,
        name: definition.name,
        description: definition.description,
        sections: definition.sections,
        downloads: definition.downloads,
        businessTypes: definition.businessTypes,
        lguCodes: definition.lguCodes,
        effectiveFrom: definition.effectiveFrom,
        effectiveTo: definition.effectiveTo,
      },
    })
  } catch (err) {
    console.error('GET /api/forms/active error:', err)
    return res.status(500).json({
      success: false,
      error: 'fetch_failed',
      message: 'Failed to fetch active form definition',
    })
  }
})

/**
 * GET /api/forms/types
 * Public endpoint to list available form types
 */
router.get('/types', async (_req, res) => {
  return res.json({
    success: true,
    types: [
      { value: 'registration', label: 'Business Registration' },
      { value: 'permit', label: 'Business Permit' },
      { value: 'renewal', label: 'Business Renewal' },
      { value: 'cessation', label: 'Cessation' },
      { value: 'violation', label: 'Violation' },
      { value: 'appeal', label: 'Appeal' },
    ],
  })
})

/**
 * GET /api/forms/:id
 * Public endpoint to get a specific published form definition by ID
 * (Only returns published definitions)
 */
router.get('/:id', async (req, res) => {
  try {
    const definition = await FormDefinition.findOne({
      _id: req.params.id,
      status: 'published',
    }).lean()

    if (!definition) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Form definition not found or not published',
      })
    }

    // Check if form group is deactivated
    if (definition.formGroupId) {
      const group = await FormGroup.findById(definition.formGroupId).lean()
      if (group?.deactivatedUntil) {
        const now = new Date()
        if (new Date(group.deactivatedUntil) > now) {
          return res.json({
            success: true,
            deactivated: true,
            availableAt: group.deactivatedUntil,
            reason: group.deactivateReason || 'This form is temporarily unavailable.',
          })
        }
      }
    }

    return res.json({
      success: true,
      definition: {
        _id: definition._id,
        formType: definition.formType,
        version: definition.version,
        name: definition.name,
        description: definition.description,
        sections: definition.sections,
        downloads: definition.downloads,
        businessTypes: definition.businessTypes,
        lguCodes: definition.lguCodes,
        effectiveFrom: definition.effectiveFrom,
        effectiveTo: definition.effectiveTo,
      },
    })
  } catch (err) {
    console.error('GET /api/forms/:id error:', err)
    return res.status(500).json({
      success: false,
      error: 'fetch_failed',
      message: 'Failed to fetch form definition',
    })
  }
})

module.exports = router
