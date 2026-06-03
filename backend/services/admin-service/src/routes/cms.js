const express = require('express')
const FaqSection = require('../models/FaqSection')
const InstructionContent = require('../models/InstructionContent')
const AuditLog = require('../models/AuditLog')
const { requireJwt } = require('../middleware/auth')
const logger = require('../lib/logger')
const { createAuditLog } = require('../lib/auditLogger')

// ─── Public router (mounted at /api/cms) ────────────────────────────────────────
const publicRouter = express.Router()

// GET /api/cms/faq/:slotId — public fetch of FAQ section
publicRouter.get('/faq/:slotId', async (req, res) => {
  try {
    const doc = await FaqSection.findOne({ slotId: req.params.slotId }).lean()
    if (!doc) return res.status(404).json({ error: 'FAQ section not found' })
    // Return published data if available and has content, otherwise fallback to main fields
    const hasPublishedData = doc.isPublished && doc.publishedData && (doc.publishedData.subtitle || (doc.publishedData.items && doc.publishedData.items.length > 0))
    const responseData = hasPublishedData
      ? { ...doc, subtitle: doc.publishedData.subtitle, items: doc.publishedData.items }
      : { ...doc, subtitle: doc.subtitle, items: doc.items }
    return res.json(responseData)
  } catch (err) {
    logger.error('GET /api/cms/faq/:slotId failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cms/instructions/:slotId — public fetch of instruction content
publicRouter.get('/instructions/:slotId', async (req, res) => {
  try {
    const doc = await InstructionContent.findOne({ slotId: req.params.slotId }).lean()
    if (!doc) return res.status(404).json({ error: 'Instruction content not found' })
    // Return published data if available and has content, otherwise fallback to main fields
    const hasPublishedData = doc.isPublished && doc.publishedData && (doc.publishedData.description || (doc.publishedData.bulletPoints && doc.publishedData.bulletPoints.length > 0) || (doc.publishedData.faqItems && doc.publishedData.faqItems.length > 0))
    const responseData = hasPublishedData
      ? { ...doc, description: doc.publishedData.description, bulletPoints: doc.publishedData.bulletPoints, faqItems: doc.publishedData.faqItems }
      : { ...doc, description: doc.description, bulletPoints: doc.bulletPoints, faqItems: doc.faqItems }
    return res.json(responseData)
  } catch (err) {
    logger.error('GET /api/cms/instructions/:slotId failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Admin router (mounted at /api/admin/cms) ──────────────────────────────────
const adminRouter = express.Router()

// GET /api/admin/cms/faq — list all FAQ sections
adminRouter.get('/faq', requireJwt, async (req, res) => {
  try {
    const docs = await FaqSection.find().sort({ slotId: 1 }).lean()
    // Return draft data for editing, fallback to main fields if draftData is empty
    const responseData = docs.map(doc => {
      const hasDraftData = doc.draftData && (doc.draftData.subtitle || (doc.draftData.items && doc.draftData.items.length > 0))
      return {
        ...doc,
        subtitle: hasDraftData ? doc.draftData.subtitle : doc.subtitle,
        items: hasDraftData ? doc.draftData.items : doc.items,
      }
    })
    return res.json(responseData)
  } catch (err) {
    logger.error('GET /api/admin/cms/faq failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/admin/cms/faq/:slotId — update FAQ section items (edit only, no create/delete slots)
adminRouter.put('/faq/:slotId', requireJwt, async (req, res) => {
  try {
    const { items, subtitle } = req.body
    const { publish = false } = req.query
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' })
    }

    const doc = await FaqSection.findOne({ slotId: req.params.slotId })
    if (!doc) return res.status(404).json({ error: 'FAQ section not found' })

    // Validate each item has question and answer
    for (const item of items) {
      if (!item.question || !item.answer) {
        return res.status(400).json({ error: 'Each item must have a question and answer' })
      }
    }

    if (publish) {
      // Publish: save to publishedData and set isPublished=true
      const previousState = { ...doc.toObject() }
      doc.publishedData = { subtitle, items }
      doc.isPublished = true
      doc.subtitle = subtitle
      doc.items = items
      doc.updatedBy = req._userId
      await doc.save()

      // Create audit log for publish
      const newState = doc.toObject()
      const changedFields = []
      if (JSON.stringify(previousState.items) !== JSON.stringify(newState.items)) changedFields.push('items')
      if (previousState.subtitle !== newState.subtitle) changedFields.push('subtitle')

      createAuditLog(
        req._userId,
        'faq_updated',
        null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        'admin',
        {
          slotId: doc.slotId,
          contentType: 'faq',
          changedFields,
        },
        doc.slotId
      ).catch((err) => logger.warn('Failed to create audit log for FAQ update', { error: err.message }))
    } else {
      // Draft: save to draftData only
      doc.draftData = { subtitle, items }
      doc.updatedBy = req._userId
      await doc.save()
    }

    return res.json(doc.toObject())
  } catch (err) {
    logger.error('PUT /api/admin/cms/faq/:slotId failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/cms/instructions — list all instruction slots
adminRouter.get('/instructions', requireJwt, async (req, res) => {
  try {
    const docs = await InstructionContent.find().sort({ slotId: 1 }).lean()
    // Return draft data for editing, fallback to main fields if draftData is empty
    const responseData = docs.map(doc => {
      const hasDraftData = doc.draftData && (doc.draftData.description || (doc.draftData.bulletPoints && doc.draftData.bulletPoints.length > 0) || (doc.draftData.faqItems && doc.draftData.faqItems.length > 0))
      return {
        ...doc,
        description: hasDraftData ? doc.draftData.description : doc.description,
        bulletPoints: hasDraftData ? doc.draftData.bulletPoints : doc.bulletPoints,
        faqItems: hasDraftData ? doc.draftData.faqItems : doc.faqItems,
      }
    })
    return res.json(responseData)
  } catch (err) {
    logger.error('GET /api/admin/cms/instructions failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/cms/instructions/:slotId — fetch single instruction by slotId
adminRouter.get('/instructions/:slotId', requireJwt, async (req, res) => {
  try {
    const doc = await InstructionContent.findOne({ slotId: req.params.slotId }).lean()
    if (!doc) return res.status(404).json({ error: 'Instruction content not found' })
    // Return draft data for editing, fallback to main fields if draftData is empty
    const hasDraftData = doc.draftData && (doc.draftData.description || (doc.draftData.bulletPoints && doc.draftData.bulletPoints.length > 0) || (doc.draftData.faqItems && doc.draftData.faqItems.length > 0))
    const responseData = {
      ...doc,
      description: hasDraftData ? doc.draftData.description : doc.description,
      bulletPoints: hasDraftData ? doc.draftData.bulletPoints : doc.bulletPoints,
      faqItems: hasDraftData ? doc.draftData.faqItems : doc.faqItems,
    }
    return res.json(responseData)
  } catch (err) {
    logger.error('GET /api/admin/cms/instructions/:slotId failed', { error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/admin/cms/instructions/:slotId — update instruction content (edit only)
adminRouter.put('/instructions/:slotId', requireJwt, async (req, res) => {
  try {
    logger.info('PUT /api/admin/cms/instructions/:slotId called', { slotId: req.params.slotId, userId: req._userId })

    const { description, bulletPoints, faqItems } = req.body
    const { publish = false } = req.query

    const doc = await InstructionContent.findOne({ slotId: req.params.slotId })
    if (!doc) return res.status(404).json({ error: 'Instruction content not found' })

    if (bulletPoints !== undefined && !Array.isArray(bulletPoints)) {
      return res.status(400).json({ error: 'bulletPoints must be an array' })
    }
    if (faqItems !== undefined && !Array.isArray(faqItems)) {
      return res.status(400).json({ error: 'faqItems must be an array' })
    }

    if (publish) {
      // Publish: save to publishedData and set isPublished=true
      const previousState = { ...doc.toObject() }
      doc.publishedData = { description, bulletPoints, faqItems }
      doc.isPublished = true
      doc.description = description
      doc.bulletPoints = bulletPoints
      doc.faqItems = faqItems
      doc.updatedBy = req._userId
      await doc.save()

      logger.info('Instruction published successfully', { slotId: doc.slotId })

      // Create audit log for publish
      const newState = doc.toObject()
      const changedFields = []
      if (previousState.description !== newState.description) changedFields.push('description')
      if (JSON.stringify(previousState.bulletPoints) !== JSON.stringify(newState.bulletPoints)) changedFields.push('bulletPoints')
      if (JSON.stringify(previousState.faqItems) !== JSON.stringify(newState.faqItems)) changedFields.push('faqItems')

      logger.info('Creating audit log for instruction update', { slotId: doc.slotId, userId: req._userId, changedFields })

      const auditResult = await createAuditLog(
        req._userId,
        'instruction_updated',
        null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        'admin',
        {
          slotId: doc.slotId,
          contentType: 'instruction',
          changedFields,
        },
        doc.slotId
      )

      if (auditResult) {
        logger.info('Audit log created successfully', { auditId: auditResult._id })
      } else {
        logger.warn('Audit log creation returned null')
      }
    } else {
      // Draft: save to draftData only
      doc.draftData = { description, bulletPoints, faqItems }
      doc.updatedBy = req._userId
      await doc.save()
      logger.info('Instruction draft saved successfully', { slotId: doc.slotId })
    }

    return res.json(doc.toObject())
  } catch (err) {
    logger.error('PUT /api/admin/cms/instructions/:slotId failed', { error: err.message, stack: err.stack })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/admin/cms/audit/:slotId — fetch audit logs for a specific CMS slot
adminRouter.get('/audit/:slotId', requireJwt, async (req, res) => {
  try {
    const { slotId } = req.params
    const { page = 1, limit = 20 } = req.query

    logger.info('GET /api/admin/cms/audit/:slotId called', { slotId, page, limit })

    const skip = (page - 1) * limit

    const filter = {
      slotId,
      eventType: { $in: ['faq_updated', 'instruction_updated'] },
    }
    logger.info('Query filter before find', { filter })

    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    logger.info('Query result', { count: logs.length })

    const total = await AuditLog.countDocuments(filter)

    logger.info('Total count', { total })

    return res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    logger.error('GET /api/admin/cms/audit/:slotId failed', { error: err.message, stack: err.stack })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = { publicRouter, adminRouter }
