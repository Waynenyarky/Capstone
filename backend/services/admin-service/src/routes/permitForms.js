const express = require('express')
const router = express.Router()
const multer = require('multer')
const { requireJwt, requireRole, optionalJwt } = require('../middleware/auth')
const respond = require('../middleware/respond')
const PermitFormsSection = require('../models/PermitFormsSection')
const { createAuditLog } = require('../lib/auditLogger')
const ipfsService = require('../lib/ipfsService')
const AuditLog = require('../models/AuditLog')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'))
    }
    cb(null, true)
  },
})

/**
 * Helper: get or create the singleton PermitFormsSection document.
 */
async function getOrCreateSection() {
  let section = await PermitFormsSection.findOne()
  if (!section) {
    section = await PermitFormsSection.create({
      sectionDescription: '',
      cards: [],
      publishedSectionDescription: '',
      publishedCards: [],
      isPublished: false,
      isEnabled: true,
    })
  }
  return section
}

// GET / — fetch current section (draft for admins, published for public)
router.get('/', optionalJwt, async (req, res) => {
  try {
    const isAdmin = req._userRole === 'admin'
    const section = await getOrCreateSection()

    if (isAdmin) {
      return respond.success(res, 200, section)
    }

    // Public: return only published data if enabled
    if (!section.isEnabled || !section.isPublished) {
      return respond.success(res, 200, { cards: [], sectionDescription: '', isEnabled: false })
    }

    return respond.success(res, 200, {
      sectionDescription: section.publishedSectionDescription,
      cards: section.publishedCards,
      isEnabled: section.isEnabled,
      lastPublishedAt: section.lastPublishedAt,
    })
  } catch (err) {
    console.error('GET /api/admin/permit-forms error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch permit forms')
  }
})

// PUT / — save draft (autosave)
router.put('/', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { sectionDescription, cards } = req.body
    const section = await getOrCreateSection()

    const oldValues = {
      sectionDescription: section.sectionDescription,
      cards: section.cards,
    }

    if (sectionDescription !== undefined) {
      section.sectionDescription = sectionDescription
    }
    if (Array.isArray(cards)) {
      section.cards = cards
    }
    section.updatedBy = req._userId
    await section.save()

    return respond.success(res, 200, section)
  } catch (err) {
    console.error('PUT /api/admin/permit-forms error:', err)
    return respond.error(res, 500, 'save_error', 'Failed to save permit forms draft')
  }
})

// POST /publish — publish current draft
router.post('/publish', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const section = await getOrCreateSection()

    if (!section.cards || section.cards.length === 0) {
      return respond.error(res, 400, 'empty_cards', 'Cannot publish with no permit form cards')
    }

    const oldPublished = {
      sectionDescription: section.publishedSectionDescription,
      cards: section.publishedCards,
    }

    section.publishedSectionDescription = section.sectionDescription
    section.publishedCards = section.cards
    section.isPublished = true
    section.lastPublishedAt = new Date()
    section.updatedBy = req._userId
    await section.save()

    await createAuditLog(
      req._userId,
      'permit_forms_published',
      'permit_forms',
      JSON.stringify(oldPublished),
      JSON.stringify({ sectionDescription: section.publishedSectionDescription, cards: section.publishedCards }),
      req._userRole,
      {
        sectionId: section._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 200, section)
  } catch (err) {
    console.error('POST /api/admin/permit-forms/publish error:', err)
    return respond.error(res, 500, 'publish_error', 'Failed to publish permit forms')
  }
})

// POST /revert — revert draft to last published version
router.post('/revert', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const section = await getOrCreateSection()

    if (!section.isPublished) {
      return respond.error(res, 400, 'no_published', 'No published version to revert to')
    }

    const oldDraft = {
      sectionDescription: section.sectionDescription,
      cards: section.cards,
    }

    section.sectionDescription = section.publishedSectionDescription
    section.cards = section.publishedCards
    section.updatedBy = req._userId
    await section.save()

    await createAuditLog(
      req._userId,
      'permit_forms_reverted',
      'permit_forms',
      JSON.stringify(oldDraft),
      JSON.stringify({ sectionDescription: section.sectionDescription, cards: section.cards }),
      req._userRole,
      {
        sectionId: section._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 200, section)
  } catch (err) {
    console.error('POST /api/admin/permit-forms/revert error:', err)
    return respond.error(res, 500, 'revert_error', 'Failed to revert permit forms')
  }
})

// PUT /enable — toggle enable/disable
router.put('/enable', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { isEnabled } = req.body
    if (typeof isEnabled !== 'boolean') {
      return respond.error(res, 400, 'invalid_field', 'isEnabled must be a boolean')
    }

    const section = await getOrCreateSection()
    const oldEnabled = section.isEnabled

    section.isEnabled = isEnabled
    section.updatedBy = req._userId
    await section.save()

    await createAuditLog(
      req._userId,
      'permit_forms_toggled',
      'permit_forms',
      JSON.stringify({ isEnabled: oldEnabled }),
      JSON.stringify({ isEnabled }),
      req._userRole,
      {
        sectionId: section._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 200, section)
  } catch (err) {
    console.error('PUT /api/admin/permit-forms/enable error:', err)
    return respond.error(res, 500, 'toggle_error', 'Failed to toggle permit forms')
  }
})

// POST /upload — upload PDF to IPFS
router.post('/upload', requireJwt, requireRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return respond.error(res, 400, 'no_file', 'No PDF file provided')
    }

    if (!ipfsService.isAvailable()) {
      return respond.error(res, 503, 'ipfs_unavailable', 'IPFS service is not available')
    }

    const { cid, size } = await ipfsService.uploadFile(req.file.buffer, req.file.originalname)

    await createAuditLog(
      req._userId,
      'permit_forms_file_uploaded',
      'permit_forms',
      null,
      JSON.stringify({ cid, fileName: req.file.originalname, size }),
      req._userRole,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    )

    return respond.success(res, 200, {
      cid,
      fileName: req.file.originalname,
      size,
    })
  } catch (err) {
    console.error('POST /api/admin/permit-forms/upload error:', err)
    return respond.error(res, 500, 'upload_error', 'Failed to upload file')
  }
})

// GET /audit — fetch audit logs for permit forms
router.get('/audit', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    const filter = { eventType: { $regex: /^permit_forms_/ } }
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'firstName lastName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ])

    return respond.success(res, 200, {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('GET /api/admin/permit-forms/audit error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch audit logs')
  }
})

module.exports = router
