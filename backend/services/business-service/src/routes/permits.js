const express = require('express')
const router = express.Router()
const { requireJwt, requireRole } = require('../middleware/auth')
const permitService = require('../services/permitIssuanceService')

/**
 * POST /api/business/permits/issue
 * Issue a new permit for an approved business
 */
router.post('/issue', requireJwt, async (req, res) => {
  try {
    const { businessId, permitType } = req.body
    
    if (!businessId) {
      return res.status(400).json({
        error: { code: 'MISSING_BUSINESS_ID', message: 'Business ID is required' }
      })
    }
    
    const permit = await permitService.issuePermit(businessId, permitType || 'initial', req._userId)
    
    return res.status(201).json({
      success: true,
      permit
    })
  } catch (error) {
    console.error('Permit issuance error:', error)
    return res.status(500).json({
      error: { code: 'ISSUANCE_ERROR', message: error.message || 'Failed to issue permit' }
    })
  }
})

/**
 * GET /api/business/permits/:permitId
 * Get permit details
 */
router.get('/:permitId', requireJwt, async (req, res) => {
  try {
    const permit = await permitService.getPermit(req.params.permitId)
    return res.json(permit)
  } catch (error) {
    console.error('Get permit error:', error)
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Permit not found' }
    })
  }
})

/**
 * GET /api/business/permits
 * Get all permits for a business
 */
router.get('/', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.query
    
    if (!businessId) {
      return res.status(400).json({
        error: { code: 'MISSING_BUSINESS_ID', message: 'Business ID is required' }
      })
    }
    
    const permits = await permitService.getBusinessPermits(businessId)
    return res.json({ permits })
  } catch (error) {
    console.error('Get permits error:', error)
    return res.status(500).json({
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch permits' }
    })
  }
})

/**
 * GET /api/business/permits/:permitId/download
 * Download permit PDF
 */
router.get('/:permitId/download', requireJwt, async (req, res) => {
  try {
    const pdfBuffer = await permitService.generatePermitPDF(req.params.permitId)
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=permit-${req.params.permitId}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    return res.status(500).json({
      error: { code: 'PDF_ERROR', message: 'Failed to generate PDF' }
    })
  }
})

/**
 * GET /api/business/permits/verify/:permitNumber
 * Verify permit authenticity
 */
router.get('/verify/:permitNumber', async (req, res) => {
  try {
    const result = await permitService.verifyPermit(req.params.permitNumber)
    return res.json(result)
  } catch (error) {
    console.error('Permit verification error:', error)
    return res.status(500).json({
      error: { code: 'VERIFICATION_ERROR', message: 'Failed to verify permit' }
    })
  }
})

/**
 * PUT /api/business/permits/:permitId/suspend
 * Suspend a permit (LGU Officer/Manager only)
 */
router.put('/:permitId/suspend', requireJwt, requireRole(['lgu_officer', 'lgu_manager']), async (req, res) => {
  try {
    const { reason } = req.body
    
    if (!reason) {
      return res.status(400).json({
        error: { code: 'MISSING_REASON', message: 'Suspension reason is required' }
      })
    }
    
    const permit = await permitService.suspendPermit(req.params.permitId, reason, req._userId)
    return res.json({ success: true, permit })
  } catch (error) {
    console.error('Permit suspension error:', error)
    return res.status(500).json({
      error: { code: 'SUSPENSION_ERROR', message: error.message || 'Failed to suspend permit' }
    })
  }
})

/**
 * PUT /api/business/permits/:permitId/revoke
 * Revoke a permit (LGU Manager only)
 */
router.put('/:permitId/revoke', requireJwt, requireRole(['lgu_manager']), async (req, res) => {
  try {
    const { reason } = req.body
    
    if (!reason) {
      return res.status(400).json({
        error: { code: 'MISSING_REASON', message: 'Revocation reason is required' }
      })
    }
    
    const permit = await permitService.revokePermit(req.params.permitId, reason, req._userId)
    return res.json({ success: true, permit })
  } catch (error) {
    console.error('Permit revocation error:', error)
    return res.status(500).json({
      error: { code: 'REVOCATION_ERROR', message: error.message || 'Failed to revoke permit' }
    })
  }
})

module.exports = router
