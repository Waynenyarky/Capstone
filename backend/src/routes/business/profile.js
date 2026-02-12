const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const router = express.Router()
const { requireJwt, requireRole } = require('../../middleware/auth')
const respond = require('../../middleware/respond')
const businessProfileService = require('../../services/businessProfileService')
const pdfService = require('../../services/pdfService')

const businessUploadsRoot = path.join(__dirname, '..', '..', '..', 'uploads', 'business-registration')
const ensureDir = (dir) => {
  try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { businessId } = req.params
    const businessDir = path.join(businessUploadsRoot, businessId || 'unknown')
    ensureDir(businessDir)
    cb(null, businessDir)
  },
  filename: (req, file, cb) => {
    const fieldName = (req.body?.fieldName || 'file').toString().replace(/[^a-zA-Z0-9_-]/g, '')
    const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '')
    const stamp = Date.now()
    cb(null, `${fieldName}_${stamp}_${safeOriginal}`)
  }
})

const upload = multer({ storage: uploadStorage })

// GET /api/business/profile - Get current user's business profile
router.get('/profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    res.json(profile)
  } catch (err) {
    console.error('GET /api/business/profile error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch business profile')
  }
})

// POST /api/business/profile - Update business profile (Step 2-8)
router.post('/profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { step, data } = req.body

    if (!step || !data) return respond.error(res, 400, 'missing_data', 'Step and data are required')

    // Extract metadata for audit logging
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    const metadata = { ip, userAgent }

    const profile = await businessProfileService.updateStep(userId, parseInt(step), data, metadata)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/profile error:', err)
    return respond.error(res, 500, 'update_error', err.message || 'Failed to update business profile')
  }
})

// GET /api/business/businesses - Get all businesses
router.get('/businesses', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    const businesses = profile.businesses || []
    res.json({ businesses })
  } catch (err) {
    console.error('GET /api/business/businesses error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch businesses')
  }
})

// GET /api/business/businesses/primary - Get primary business
router.get('/businesses/primary', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const profile = await businessProfileService.getProfile(req._userId)
    const primaryBusiness = profile.businesses?.find(b => b.isPrimary) || null
    res.json({ business: primaryBusiness })
  } catch (err) {
    console.error('GET /api/business/businesses/primary error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch primary business')
  }
})

// POST /api/business/businesses - Add new business
router.post('/businesses', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const businessData = req.body

    const result = await businessProfileService.addBusiness(userId, businessData)
    const profileObj = result.profile && typeof result.profile.toObject === 'function'
      ? result.profile.toObject()
      : result.profile
    res.json({ ...profileObj, businessId: result.businessId })
  } catch (err) {
    console.error('POST /api/business/businesses error:', err)
    return respond.error(res, 400, 'add_error', err.message || 'Failed to add business')
  }
})

// PUT /api/business/businesses/:businessId - Update business
router.put('/businesses/:businessId', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const businessData = req.body

    const profile = await businessProfileService.updateBusiness(userId, businessId, businessData)
    res.json(profile)
  } catch (err) {
    console.error('PUT /api/business/businesses/:businessId error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to update business')
  }
})

// PATCH /api/business/businesses/:businessId - Update business status only
router.patch('/businesses/:businessId', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const { businessStatus } = req.body || {}

    const profile = await businessProfileService.updateBusinessStatus(userId, businessId, { businessStatus })
    res.json(profile)
  } catch (err) {
    console.error('PATCH /api/business/businesses/:businessId error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to update business status')
  }
})

// DELETE /api/business/businesses/:businessId - Delete business
router.delete('/businesses/:businessId', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    const profile = await businessProfileService.deleteBusiness(userId, businessId)
    res.json(profile)
  } catch (err) {
    console.error('DELETE /api/business/businesses/:businessId error:', err)
    return respond.error(res, 400, 'delete_error', err.message || 'Failed to delete business')
  }
})

// POST /api/business/businesses/:businessId/primary - Set business as primary
router.post('/businesses/:businessId/primary', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    const profile = await businessProfileService.setPrimaryBusiness(userId, businessId)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/businesses/:businessId/primary error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to set primary business')
  }
})

// PUT /api/business/businesses/:businessId/risk-profile - Update risk profile
router.put('/businesses/:businessId/risk-profile', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const riskProfileData = req.body

    const profile = await businessProfileService.updateBusinessRiskProfile(userId, businessId, riskProfileData)
    res.json(profile)
  } catch (err) {
    console.error('PUT /api/business/businesses/:businessId/risk-profile error:', err)
    return respond.error(res, 400, 'update_error', err.message || 'Failed to update risk profile')
  }
})

// Business Registration Application Routes

// POST /api/business/business-registration/:businessId/requirements/confirm - Mark requirements viewed
router.post('/business-registration/:businessId/requirements/confirm', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    // For "new" business registrations, we don't need to confirm against an existing business
    // Just return success - the confirmation will be saved when the business is created in Step 2
    if (!businessId || businessId === 'new') {
      return res.json({ 
        confirmed: true, 
        message: 'Requirements checklist confirmed. Please proceed to Step 2 to fill out the application form.',
        businessId: 'new'
      })
    }

    const profile = await businessProfileService.confirmRequirementsChecklist(userId, businessId)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/business-registration/:businessId/requirements/confirm error:', err)
    return respond.error(res, 400, 'confirm_error', err.message || 'Failed to confirm requirements')
  }
})

// GET /api/business/business-registration/:businessId/requirements/pdf - Generate and download PDF checklist
router.get('/business-registration/:businessId/requirements/pdf', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    // For "new" business registrations, we allow PDF download without an existing business
    // The requirements checklist is static and doesn't require a business to exist
    const isNewBusiness = !businessId || businessId === 'new'

    // If business exists, mark PDF as downloaded (non-blocking)
    if (!isNewBusiness) {
      try {
        const business = await businessProfileService.getBusiness(userId, businessId)
        if (business) {
          try {
            await businessProfileService.markRequirementsPdfDownloaded(userId, businessId)
          } catch (markError) {
            console.error('Failed to mark PDF as downloaded:', markError)
            // Don't fail the request if this fails
          }
        }
      } catch (businessError) {
        console.error('Failed to verify business:', businessError)
        // Continue anyway - PDF download doesn't require business to exist
      }
    }

    // Generate PDF
    try {
      const pdfBuffer = await pdfService.generateRequirementsChecklistPDF()

      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error('PDF buffer is empty')
        return respond.error(res, 500, 'pdf_generation_failed', 'Generated PDF is empty')
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="Business_Registration_Requirements_Checklist_${Date.now()}.pdf"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      res.send(pdfBuffer)
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      // Check if it's a missing module error
      if (pdfError.message && pdfError.message.includes('Cannot find module')) {
        return respond.error(res, 500, 'pdf_module_missing', 'PDF generation module not installed. Please install pdfkit: npm install pdfkit')
      }
      throw pdfError
    }
  } catch (err) {
    console.error('GET /api/business/business-registration/:businessId/requirements/pdf error:', err)
    return respond.error(res, 500, 'pdf_error', err.message || 'Failed to generate PDF')
  }
})

// POST /api/business/business-registration/:businessId/documents/upload - Upload LGU documents
router.post('/business-registration/:businessId/documents/upload', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const documents = req.body // Expect document URLs in request body

    // For "new" business registrations, documents cannot be saved yet as the business doesn't exist
    // Return error with helpful message - user must complete Step 2 (Application Form) first
    if (!businessId || businessId === 'new') {
      return respond.error(res, 400, 'business_required', 'Please complete Step 2 (Application Form) to create the business before uploading documents.')
    }

    const profile = await businessProfileService.updateLGUDocuments(userId, businessId, documents)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/business-registration/:businessId/documents/upload error:', err)
    return respond.error(res, 400, 'upload_error', err.message || 'Failed to upload documents')
  }
})

// POST /api/business/business-registration/:businessId/documents/upload-file - Upload a single file and return URL
router.post(
  '/business-registration/:businessId/documents/upload-file',
  requireJwt,
  requireRole(['business_owner']),
  upload.single('file'),
  async (req, res) => {
    try {
      const { businessId } = req.params
      if (!businessId || businessId === 'new') {
        return respond.error(res, 400, 'business_required', 'Please complete Step 2 (Application Form) to create the business before uploading documents.')
      }
      if (!req.file) {
        return respond.error(res, 400, 'file_required', 'No file uploaded')
      }
      const filename = path.basename(req.file.path)
      const url = `/uploads/business-registration/${businessId}/${filename}`
      res.json({ url })
    } catch (err) {
      console.error('POST /api/business/business-registration/:businessId/documents/upload-file error:', err)
      return respond.error(res, 400, 'upload_error', err.message || 'Failed to upload file')
    }
  }
)

// POST /api/business/business-registration/:businessId/bir - Save BIR registration info
router.post('/business-registration/:businessId/bir', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const birData = req.body

    const profile = await businessProfileService.updateBIRRegistration(userId, businessId, birData)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/business-registration/:businessId/bir error:', err)
    return respond.error(res, 400, 'bir_error', err.message || 'Failed to save BIR registration')
  }
})

// POST /api/business/business-registration/:businessId/agencies - Save other agency registrations
router.post('/business-registration/:businessId/agencies', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params
    const agencyData = req.body

    // If businessId is 'new', prevent saving until the business is created in Step 2
    if (businessId === 'new') {
      return respond.error(res, 400, 'business_not_created', 'Please complete Step 2 (Application Form) to create the business before saving agency registration details.')
    }

    const profile = await businessProfileService.updateOtherAgencyRegistrations(userId, businessId, agencyData)
    res.json(profile)
  } catch (err) {
    console.error('POST /api/business/business-registration/:businessId/agencies error:', err)
    return respond.error(res, 400, 'agency_error', err.message || 'Failed to save agency registrations')
  }
})

// POST /api/business/business-registration/:businessId/submit - Submit application to LGU
router.post('/business-registration/:businessId/submit', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    const profile = await businessProfileService.submitBusinessApplication(userId, businessId)
    const business = profile.businesses?.find(b => b.businessId === businessId)
    
    res.json({
      profile,
      referenceNumber: business?.applicationReferenceNumber,
      status: business?.applicationStatus,
      submittedAt: business?.submittedAt
    })
  } catch (err) {
    console.error('POST /api/business/business-registration/:businessId/submit error:', err)
    return respond.error(res, 400, 'submit_error', err.message || 'Failed to submit application')
  }
})

// GET /api/business/business-registration/:businessId/status - Get application status
router.get('/business-registration/:businessId/status', requireJwt, requireRole(['business_owner']), async (req, res) => {
  try {
    const userId = req._userId
    const { businessId } = req.params

    console.log(`[GET /status] Business Owner ${userId} requesting status for businessId=${businessId}`)

    const status = await businessProfileService.getBusinessApplicationStatus(userId, businessId)
    
    console.log(`[GET /status] Status retrieved for businessId=${businessId}, applicationStatus=${status.applicationStatus || 'N/A'}`)
    
    res.json(status)
  } catch (err) {
    console.error(`[GET /status] Error getting status for businessId=${req.params.businessId}, userId=${req._userId}:`, err)
    return respond.error(res, 400, 'status_error', err.message || 'Failed to get application status')
  }
})

module.exports = router
