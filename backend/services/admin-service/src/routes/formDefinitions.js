const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { requireJwt, requireRole } = require('../middleware/auth')
const { validateBody, Joi } = require('../middleware/validation')
const respond = require('../middleware/respond')
const FormDefinition = require('../models/FormDefinition')
const FormGroup = require('../models/FormGroup')
const AdminApproval = require('../models/AdminApproval')
const logger = require('../lib/logger')
const { INDUSTRY_SCOPE_VALUES, BUSINESS_TYPE_VALUES, INDUSTRY_SCOPE_LABELS } = require('../../../../shared/constants')

const router = express.Router()

// Setup file upload storage
const formTemplatesRoot = path.join(__dirname, '..', '..', '..', 'uploads', 'form-templates')
const ensureDir = (dir) => {
  try { fs.mkdirSync(dir, { recursive: true }) } catch (_) {}
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params
    const formDir = path.join(formTemplatesRoot, id || 'unknown')
    ensureDir(formDir)
    cb(null, formDir)
  },
  filename: (req, file, cb) => {
    const safeOriginal = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
    const stamp = Date.now()
    cb(null, `template_${stamp}_${safeOriginal}`)
  }
})

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow only PDFs and common document types
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX files are allowed'), false)
    }
  }
})

// Validation schemas
const requirementItemSchema = Joi.object({
  label: Joi.string().required(),
  required: Joi.boolean().optional(),
  notes: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'file', 'download', 'checkbox', 'address').optional(),
  placeholder: Joi.string().allow('', null).optional(),
  helpText: Joi.string().allow('', null).optional(),
  span: Joi.number().min(1).max(24).optional(),
  validation: Joi.object().unknown(true).optional(),
  dropdownSource: Joi.string().allow('', null).optional(),
  dropdownOptions: Joi.array().items(Joi.string()).optional(),
  downloadFileName: Joi.string().allow('', null).optional(),
  downloadFileSize: Joi.number().optional(),
  downloadFileType: Joi.string().allow('', null).optional(),
  downloadFileUrl: Joi.string().allow('', null).optional(),
  downloadIpfsCid: Joi.string().allow('', null).optional(),
})

const sectionSchema = Joi.object({
  category: Joi.string().required(),
  source: Joi.string().allow('', null).optional(),
  items: Joi.array().items(requirementItemSchema).optional(),
  notes: Joi.string().allow('', null).optional(),
})

const downloadSchema = Joi.object({
  label: Joi.string().required(),
  fileUrl: Joi.string().required(),
  ipfsCid: Joi.string().allow('', null).optional(),
  fileType: Joi.string().optional(),
  fileSize: Joi.number().optional(),
  uploadedAt: Joi.date().optional(),
})

const createFormDefinitionSchema = Joi.object({
  formType: Joi.string().valid('registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal', 'inspections').required(),
  version: Joi.string().required(),
  name: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  businessTypes: Joi.array().items(
    Joi.string().valid(...BUSINESS_TYPE_VALUES)
  ).optional(),
  lguCodes: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(sectionSchema).optional(),
  downloads: Joi.array().items(downloadSchema).optional(),
  effectiveFrom: Joi.date().allow(null).optional(),
  effectiveTo: Joi.date().allow(null).optional(),
})

const updateFormDefinitionSchema = Joi.object({
  version: Joi.string().optional(),
  name: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  businessTypes: Joi.array().items(
    Joi.string().valid(...BUSINESS_TYPE_VALUES)
  ).optional(),
  lguCodes: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(sectionSchema).optional(),
  downloads: Joi.array().items(downloadSchema).optional(),
  effectiveFrom: Joi.date().allow(null).optional(),
  effectiveTo: Joi.date().allow(null).optional(),
})

// GET /api/admin/forms - List form definitions
router.get('/', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { formType, status, search, page = 1, limit = 20 } = req.query

    const filter = {}
    if (formType) filter.formType = formType
    if (status) filter.status = status
    if (search && String(search).trim()) {
      const raw = String(search).trim()
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { version: { $regex: escaped, $options: 'i' } },
        { formType: { $regex: escaped, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [definitions, total] = await Promise.all([
      FormDefinition.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'email firstName lastName')
        .populate('updatedBy', 'email firstName lastName')
        .populate('publishedBy', 'email firstName lastName')
        .lean(),
      FormDefinition.countDocuments(filter),
    ])

    return res.json({
      success: true,
      definitions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    console.error('GET /api/admin/forms error:', err)
    return respond.error(res, 500, 'form_list_failed', 'Failed to load form definitions')
  }
})

// --- Form Groups (must be before /:id) ---

const createFormGroupSchema = Joi.object({
  formType: Joi.string().valid('registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal', 'inspections').required(),
  industryScope: Joi.string().valid(...INDUSTRY_SCOPE_VALUES).default('all'),
})

// GET /api/admin/forms/groups - List form groups for table
router.get('/groups', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { formType, industryScope, search, page = 1, limit = 50, includeRetired = 'false' } = req.query

    const filter = {}
    if (formType) filter.formType = formType
    if (industryScope) filter.industryScope = industryScope
    if (includeRetired !== 'true') filter.retiredAt = null
    if (search && String(search).trim()) {
      const raw = String(search).trim()
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { displayName: { $regex: escaped, $options: 'i' } },
        { formType: { $regex: escaped, $options: 'i' } },
        { industryScope: { $regex: escaped, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [groups, total] = await Promise.all([
      FormGroup.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      FormGroup.countDocuments(filter),
    ])

    // Attach latest updatedAt from each group's versions
    const groupsWithMeta = await Promise.all(
      groups.map(async (g) => {
        const latest = await FormDefinition.findOne({ formGroupId: g._id })
          .sort({ updatedAt: -1 })
          .select('updatedAt')
          .lean()
        return {
          ...g,
          lastUpdated: latest?.updatedAt || g.updatedAt,
        }
      })
    )

    return res.json({
      success: true,
      groups: groupsWithMeta,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    console.error('GET /api/admin/forms/groups error:', err)
    return respond.error(res, 500, 'form_groups_list_failed', 'Failed to load form groups')
  }
})

// GET /api/admin/forms/audit-log - Recent form definition change activity
router.get('/audit-log', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const entries = await FormDefinition.aggregate([
      { $match: { 'changeLog.0': { $exists: true } } },
      { $unwind: '$changeLog' },
      { $sort: { 'changeLog.at': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'changeLog.by',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { email: 1, firstName: 1, lastName: 1 } }],
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$user', 0] },
        },
      },
      {
        $project: {
          definitionId: '$_id',
          formGroupId: 1,
          formType: 1,
          industryScope: 1,
          version: 1,
          name: 1,
          action: '$changeLog.action',
          at: '$changeLog.at',
          changes: '$changeLog.changes',
          comment: '$changeLog.comment',
          user: 1,
          system: '$changeLog.system',
        },
      },
    ])
    return res.json({ success: true, entries })
  } catch (err) {
    console.error('GET /api/admin/forms/audit-log error:', err)
    return respond.error(res, 500, 'audit_log_failed', 'Failed to load audit log')
  }
})

// GET /api/admin/forms/groups/stats - Counts for activated, deactivated, retired
router.get('/groups/stats', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const now = new Date()
    const [activated, deactivated, retired] = await Promise.all([
      FormGroup.countDocuments({
        retiredAt: null,
        $or: [
          { deactivatedUntil: null },
          { deactivatedUntil: { $exists: false } },
          { deactivatedUntil: { $lte: now } },
        ],
      }),
      FormGroup.countDocuments({
        retiredAt: null,
        deactivatedUntil: { $exists: true, $ne: null, $gt: now },
      }),
      FormGroup.countDocuments({ retiredAt: { $ne: null } }),
    ])
    return res.json({ success: true, stats: { activated, deactivated, retired } })
  } catch (err) {
    console.error('GET /api/admin/forms/groups/stats error:', err)
    return respond.error(res, 500, 'form_groups_stats_failed', 'Failed to load form group stats')
  }
})

// GET /api/admin/forms/groups/:groupId - Get group + all versions
router.get('/groups/:groupId', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const group = await FormGroup.findById(req.params.groupId).lean()
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }

    const versions = await FormDefinition.find({ formGroupId: group._id })
      .sort({ version: -1, updatedAt: -1 })
      .populate('createdBy', 'email firstName lastName')
      .populate('updatedBy', 'email firstName lastName')
      .populate('publishedBy', 'email firstName lastName')
      .lean()

    return res.json({ success: true, group, versions })
  } catch (err) {
    console.error('GET /api/admin/forms/groups/:groupId error:', err)
    return respond.error(res, 500, 'form_group_get_failed', 'Failed to load form group')
  }
})

// POST /api/admin/forms/groups - Create form group + first draft version
router.post('/groups', requireJwt, requireRole(['admin']), validateBody(createFormGroupSchema), async (req, res) => {
  try {
    const userId = req._userId
    const { formType, industryScope = 'all' } = req.body

    const existing = await FormGroup.findOne({ formType, industryScope, retiredAt: null })
    if (existing) {
      return respond.error(res, 400, 'form_group_exists', 'A form group with this type and industry already exists')
    }

    const typeLabels = {
      registration: 'Business Registration',
      permit: 'Business Permit',
      renewal: 'Business Renewal',
      cessation: 'Cessation',
      violation: 'Violation',
      appeal: 'Appeal',
      inspections: 'Inspections',
    }
    const displayName = `${typeLabels[formType]} - ${INDUSTRY_SCOPE_LABELS[industryScope] || industryScope}`

    const group = await FormGroup.create({
      formType,
      industryScope,
      displayName,
    })

    const year = new Date().getFullYear()
    const version = `${year}.1`

    const businessTypes = industryScope === 'all' ? [] : [industryScope]
    const definition = await FormDefinition.create({
      formGroupId: group._id,
      formType,
      version,
      industryScope,
      name: displayName,
      description: '',
      status: 'draft',
      businessTypes,
      lguCodes: [],
      sections: [],
      downloads: [],
      effectiveFrom: null,
      effectiveTo: null,
      createdBy: userId,
      updatedBy: userId,
      changeLog: [{ action: 'created', by: userId, at: new Date(), changes: {} }],
    })

    return res.status(201).json({
      success: true,
      group,
      definition,
    })
  } catch (err) {
    console.error('POST /api/admin/forms/groups error:', err)
    return respond.error(res, 500, 'form_group_create_failed', 'Failed to create form group')
  }
})

// GET /api/admin/forms/groups/:groupId/versions - List versions (same as GET group, but versions only)
router.get('/groups/:groupId/versions', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const group = await FormGroup.findById(req.params.groupId).lean()
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }

    const versions = await FormDefinition.find({ formGroupId: group._id })
      .sort({ version: -1, updatedAt: -1 })
      .populate('createdBy', 'email firstName lastName')
      .populate('updatedBy', 'email firstName lastName')
      .populate('publishedBy', 'email firstName lastName')
      .lean()

    return res.json({ success: true, versions })
  } catch (err) {
    console.error('GET /api/admin/forms/groups/:groupId/versions error:', err)
    return respond.error(res, 500, 'form_versions_list_failed', 'Failed to load versions')
  }
})

// POST /api/admin/forms/groups/:groupId/versions - Create new version (draft)
router.post('/groups/:groupId/versions', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const group = await FormGroup.findById(req.params.groupId).lean()
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }

    const year = new Date().getFullYear()
    const existingVersions = await FormDefinition.find({
      formGroupId: group._id,
      version: { $regex: `^${year}\\.` },
    }).select('version').lean()

    let nextNum = 1
    for (const v of existingVersions) {
      const m = v.version.match(new RegExp(`^${year}\\.(\\d+)$`))
      if (m) nextNum = Math.max(nextNum, parseInt(m[1], 10) + 1)
    }
    const version = `${year}.${nextNum}`

    const businessTypes = group.industryScope === 'all' ? [] : [group.industryScope]
    const definition = await FormDefinition.create({
      formGroupId: group._id,
      formType: group.formType,
      version,
      industryScope: group.industryScope,
      name: group.displayName,
      description: '',
      status: 'draft',
      businessTypes,
      lguCodes: [],
      sections: [],
      downloads: [],
      effectiveFrom: null,
      effectiveTo: null,
      createdBy: userId,
      updatedBy: userId,
      changeLog: [{ action: 'created', by: userId, at: new Date(), changes: { version } }],
    })

    return res.status(201).json({ success: true, definition })
  } catch (err) {
    console.error('POST /api/admin/forms/groups/:groupId/versions error:', err)
    return respond.error(res, 500, 'form_version_create_failed', 'Failed to create version')
  }
})

// POST /api/admin/forms/groups/:groupId/retire - Retire form group (soft)
router.post('/groups/:groupId/retire', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const group = await FormGroup.findById(req.params.groupId)
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }
    if (group.retiredAt) {
      return respond.error(res, 400, 'already_retired', 'Form group is already retired')
    }
    group.retiredAt = new Date()
    await group.save()
    return res.json({ success: true, group })
  } catch (err) {
    console.error('POST /api/admin/forms/groups/:groupId/retire error:', err)
    return respond.error(res, 500, 'retire_failed', 'Failed to retire form group')
  }
})

// POST /api/admin/forms/groups/:groupId/deactivate - Temporarily deactivate form group
const deactivateSchema = Joi.object({
  deactivatedUntil: Joi.date().iso().required(),
  reason: Joi.string().allow('').optional(),
})
router.post('/groups/:groupId/deactivate', requireJwt, requireRole(['admin']), validateBody(deactivateSchema), async (req, res) => {
  try {
    const group = await FormGroup.findById(req.params.groupId)
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }
    if (group.retiredAt) {
      return respond.error(res, 400, 'cannot_deactivate_retired', 'Cannot deactivate a retired form group')
    }
    const { deactivatedUntil, reason = '' } = req.body
    const until = new Date(deactivatedUntil)
    if (until <= new Date()) {
      return respond.error(res, 400, 'invalid_date', 'Deactivated until must be in the future')
    }
    group.deactivatedAt = new Date()
    group.deactivatedUntil = until
    group.deactivateReason = reason
    await group.save()
    return res.json({ success: true, group })
  } catch (err) {
    console.error('POST /api/admin/forms/groups/:groupId/deactivate error:', err)
    return respond.error(res, 500, 'deactivate_failed', 'Failed to deactivate form group')
  }
})

// POST /api/admin/forms/groups/:groupId/reactivate - Reactivate form group
router.post('/groups/:groupId/reactivate', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const group = await FormGroup.findById(req.params.groupId)
    if (!group) {
      return respond.error(res, 404, 'form_group_not_found', 'Form group not found')
    }
    group.deactivatedAt = null
    group.deactivatedUntil = null
    group.deactivateReason = ''
    await group.save()
    return res.json({ success: true, group })
  } catch (err) {
    console.error('POST /api/admin/forms/groups/:groupId/reactivate error:', err)
    return respond.error(res, 500, 'reactivate_failed', 'Failed to reactivate form group')
  }
})

// PUT /api/admin/forms/:id/set-active - Set version as active (publish it, archive previous)
router.put('/:id/set-active', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const definition = await FormDefinition.findById(req.params.id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (definition.status !== 'draft') {
      return respond.error(res, 400, 'form_not_draft', 'Only draft versions can be set as active')
    }

    if (!definition.sections || definition.sections.length === 0) {
      return respond.error(res, 400, 'form_no_sections', 'Add at least one section before publishing')
    }

    const now = new Date()

    // Archive current published version in this group
    await FormDefinition.updateMany(
      { formGroupId: definition.formGroupId, status: 'published' },
      { $set: { status: 'archived', updatedBy: userId }, $push: { changeLog: { action: 'archived', by: userId, at: now, changes: { reason: 'superseded' } } } }
    )

    // Publish this version
    definition.status = 'published'
    definition.publishedBy = userId
    definition.publishedAt = now
    definition.effectiveFrom = now
    definition.effectiveTo = null
    definition.updatedBy = userId
    definition.addChangeLog('published', userId, {})

    await definition.save()

    return res.json({ success: true, definition })
  } catch (err) {
    console.error('PUT /api/admin/forms/:id/set-active error:', err)
    return respond.error(res, 500, 'set_active_failed', 'Failed to set version as active')
  }
})

// GET /api/admin/forms/:id - Get single form definition
router.get('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const definition = await FormDefinition.findById(req.params.id)
      .populate('createdBy', 'email firstName lastName')
      .populate('updatedBy', 'email firstName lastName')
      .populate('publishedBy', 'email firstName lastName')
      .lean()

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    return res.json({ success: true, definition })
  } catch (err) {
    console.error('GET /api/admin/forms/:id error:', err)
    return respond.error(res, 500, 'form_get_failed', 'Failed to load form definition')
  }
})

// POST /api/admin/forms - Create new form definition (draft)
router.post('/', requireJwt, requireRole(['admin']), validateBody(createFormDefinitionSchema), async (req, res) => {
  try {
    const userId = req._userId
    const {
      formType,
      version,
      name,
      description,
      businessTypes,
      lguCodes,
      sections,
      downloads,
      effectiveFrom,
      effectiveTo,
    } = req.body

    const definition = new FormDefinition({
      formType,
      version,
      name: name || `${formType} requirements v${version}`,
      description: description || '',
      status: 'draft',
      businessTypes: businessTypes || [],
      lguCodes: (lguCodes || []).map((c) => c.toUpperCase()),
      sections: sections || [],
      downloads: downloads || [],
      effectiveFrom: effectiveFrom || null,
      effectiveTo: effectiveTo || null,
      createdBy: userId,
      updatedBy: userId,
      changeLog: [{
        action: 'created',
        by: userId,
        at: new Date(),
        changes: {},
      }],
    })

    await definition.save()

    return res.status(201).json({ success: true, definition })
  } catch (err) {
    console.error('POST /api/admin/forms error:', err)
    return respond.error(res, 500, 'form_create_failed', 'Failed to create form definition')
  }
})

// PUT /api/admin/forms/:id - Update form definition (draft only)
router.put('/:id', requireJwt, requireRole(['admin']), validateBody(updateFormDefinitionSchema), async (req, res) => {
  try {
    const userId = req._userId
    const definition = await FormDefinition.findById(req.params.id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (!definition.canEdit()) {
      return respond.error(res, 400, 'form_not_editable', 'Only draft form definitions can be edited')
    }

    const {
      version,
      name,
      description,
      businessTypes,
      lguCodes,
      sections,
      downloads,
      effectiveFrom,
      effectiveTo,
    } = req.body

    // Track changes
    const changes = {}
    if (version !== undefined && version !== definition.version) {
      changes.version = { from: definition.version, to: version }
      definition.version = version
    }
    if (name !== undefined) definition.name = name
    if (description !== undefined) definition.description = description
    if (businessTypes !== undefined) definition.businessTypes = businessTypes
    if (lguCodes !== undefined) definition.lguCodes = lguCodes.map((c) => c.toUpperCase())
    if (sections !== undefined) {
      changes.sectionsCount = { from: definition.sections.length, to: sections.length }
      definition.sections = sections
    }
    if (downloads !== undefined) definition.downloads = downloads
    if (effectiveFrom !== undefined) definition.effectiveFrom = effectiveFrom
    if (effectiveTo !== undefined) definition.effectiveTo = effectiveTo

    definition.updatedBy = userId
    definition.addChangeLog('updated', userId, changes)

    await definition.save()

    return res.json({ success: true, definition })
  } catch (err) {
    console.error('PUT /api/admin/forms/:id error:', err)
    return respond.error(res, 500, 'form_update_failed', 'Failed to update form definition')
  }
})

// POST /api/admin/forms/:id/submit-for-approval - Submit form definition for 2-admin approval
router.post('/:id/submit-for-approval', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const definition = await FormDefinition.findById(req.params.id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (!definition.canSubmitForApproval()) {
      return respond.error(res, 400, 'form_cannot_submit', 'Form definition cannot be submitted for approval. Ensure it is a draft with at least one section.')
    }

    // Create approval request
    const approvalId = AdminApproval.generateApprovalId()
    const approval = await AdminApproval.create({
      approvalId,
      requestType: 'form_definition',
      userId, // The admin making the request
      requestedBy: userId,
      requestDetails: {
        formDefinitionId: String(definition._id),
        formType: definition.formType,
        version: definition.version,
        name: definition.name,
        sectionsCount: definition.sections.length,
        downloadsCount: definition.downloads.length,
      },
      status: 'pending',
      requiredApprovals: 2,
    })

    // Update form definition status
    definition.status = 'pending_approval'
    definition.approvalId = approvalId
    definition.updatedBy = userId
    definition.addChangeLog('submitted_for_approval', userId, { approvalId })

    await definition.save()

    logger.info('Form definition submitted for approval', {
      formDefinitionId: String(definition._id),
      approvalId,
      submittedBy: userId,
    })

    return res.json({
      success: true,
      definition,
      approval: {
        approvalId: approval.approvalId,
        status: approval.status,
        requiredApprovals: approval.requiredApprovals,
      },
    })
  } catch (err) {
    console.error('POST /api/admin/forms/:id/submit-for-approval error:', err)
    return respond.error(res, 500, 'submit_approval_failed', 'Failed to submit form for approval')
  }
})

// POST /api/admin/forms/:id/cancel-approval - Cancel pending approval and return to draft
router.post('/:id/cancel-approval', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const definition = await FormDefinition.findById(req.params.id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (definition.status !== 'pending_approval') {
      return respond.error(res, 400, 'not_pending', 'Form definition is not pending approval')
    }

    // Update the approval to rejected/cancelled
    if (definition.approvalId) {
      await AdminApproval.updateOne(
        { approvalId: definition.approvalId },
        { status: 'rejected' }
      )
    }

    // Return form to draft
    definition.status = 'draft'
    definition.approvalId = ''
    definition.updatedBy = userId
    definition.addChangeLog('rejected', userId, { reason: 'Approval cancelled' })

    await definition.save()

    return res.json({ success: true, definition })
  } catch (err) {
    console.error('POST /api/admin/forms/:id/cancel-approval error:', err)
    return respond.error(res, 500, 'cancel_failed', 'Failed to cancel approval')
  }
})

// POST /api/admin/forms/:id/archive - Archive a form definition
router.post('/:id/archive', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const definition = await FormDefinition.findById(req.params.id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (!definition.canArchive()) {
      return respond.error(res, 400, 'form_cannot_archive', 'This form definition cannot be archived')
    }

    definition.status = 'archived'
    definition.updatedBy = userId
    definition.addChangeLog('archived', userId, { previousStatus: definition.status })

    await definition.save()

    return res.json({ success: true, definition })
  } catch (err) {
    console.error('POST /api/admin/forms/:id/archive error:', err)
    return respond.error(res, 500, 'form_archive_failed', 'Failed to archive form definition')
  }
})

// POST /api/admin/forms/:id/duplicate - Duplicate a form definition as a new draft
router.post('/:id/duplicate', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req._userId
    const source = await FormDefinition.findById(req.params.id).lean()

    if (!source) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    // Parse version and increment
    const versionParts = source.version.split('.')
    const lastPart = parseInt(versionParts[versionParts.length - 1] || '0') + 1
    versionParts[versionParts.length - 1] = String(lastPart)
    const newVersion = versionParts.join('.')

    const duplicate = new FormDefinition({
      formType: source.formType,
      version: newVersion,
      name: `${source.name} (copy)`,
      description: source.description,
      status: 'draft',
      businessTypes: source.businessTypes,
      lguCodes: source.lguCodes,
      sections: source.sections,
      downloads: source.downloads,
      effectiveFrom: null,
      effectiveTo: null,
      createdBy: userId,
      updatedBy: userId,
      changeLog: [{
        action: 'created',
        by: userId,
        at: new Date(),
        changes: { duplicatedFrom: source._id },
      }],
    })

    await duplicate.save()

    return res.status(201).json({ success: true, definition: duplicate })
  } catch (err) {
    console.error('POST /api/admin/forms/:id/duplicate error:', err)
    return respond.error(res, 500, 'form_duplicate_failed', 'Failed to duplicate form definition')
  }
})

// POST /api/admin/forms/:id/upload - Upload template file
router.post('/:id/upload', requireJwt, requireRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params
    const definition = await FormDefinition.findById(id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (!definition.canEdit()) {
      return respond.error(res, 400, 'form_not_editable', 'Only draft form definitions can have files uploaded')
    }

    if (!req.file) {
      return respond.error(res, 400, 'file_required', 'No file uploaded')
    }

    // Try IPFS upload if available
    let ipfsService = null
    try {
      ipfsService = require('../lib/ipfsService')
      if (!ipfsService.isAvailable()) {
        await ipfsService.initialize()
      }
    } catch (err) {
      logger.warn('IPFS service not available for form template upload', { error: err.message })
    }

    let fileUrl, ipfsCid

    if (ipfsService && ipfsService.isAvailable()) {
      try {
        const fileBuffer = await fs.promises.readFile(req.file.path)
        const fileName = req.file.originalname || path.basename(req.file.path)
        const { cid, size } = await ipfsService.uploadFile(fileBuffer, fileName)

        await ipfsService.pinFile(cid).catch((err) => {
          logger.warn('Failed to pin template to IPFS', { cid, error: err.message })
        })

        fileUrl = ipfsService.getGatewayUrl(cid)
        ipfsCid = cid

        // Delete local file after IPFS upload
        try {
          await fs.promises.unlink(req.file.path)
        } catch (_) {}

        logger.info('Form template uploaded to IPFS', { cid, formId: id })
      } catch (ipfsErr) {
        logger.error('IPFS upload failed for form template', { error: ipfsErr.message })
        // Fall through to local storage
      }
    }

    // Fallback to local storage
    if (!fileUrl) {
      const filename = path.basename(req.file.path)
      fileUrl = `/uploads/form-templates/${id}/${filename}`
      ipfsCid = ''
      logger.info('Form template saved to local storage', { url: fileUrl, formId: id })
    }

    // Add to downloads array
    const downloadEntry = {
      label: req.body.label || req.file.originalname || 'Template',
      fileUrl,
      ipfsCid: ipfsCid || '',
      fileType: path.extname(req.file.originalname || '').replace('.', '') || 'pdf',
      fileSize: req.file.size,
      uploadedAt: new Date(),
    }

    definition.downloads.push(downloadEntry)
    definition.updatedBy = req._userId
    definition.addChangeLog('updated', req._userId, { addedDownload: downloadEntry.label })

    await definition.save()

    return res.json({
      success: true,
      download: downloadEntry,
      definition,
    })
  } catch (err) {
    console.error('POST /api/admin/forms/:id/upload error:', err)
    return respond.error(res, 500, 'upload_failed', err.message || 'Failed to upload file')
  }
})

// DELETE /api/admin/forms/:id - Delete draft form definition
router.delete('/:id', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const definition = await FormDefinition.findById(req.params.id)
    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }
    if (!definition.canEdit()) {
      return respond.error(res, 400, 'form_not_editable', 'Only draft form definitions can be deleted')
    }
    await FormDefinition.deleteOne({ _id: definition._id })
    return res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/forms/:id error:', err)
    return respond.error(res, 500, 'form_delete_failed', 'Failed to delete form definition')
  }
})

// DELETE /api/admin/forms/:id/downloads/:index - Remove a download from form definition
router.delete('/:id/downloads/:index', requireJwt, requireRole(['admin']), async (req, res) => {
  try {
    const { id, index } = req.params
    const definition = await FormDefinition.findById(id)

    if (!definition) {
      return respond.error(res, 404, 'form_not_found', 'Form definition not found')
    }

    if (!definition.canEdit()) {
      return respond.error(res, 400, 'form_not_editable', 'Only draft form definitions can have downloads removed')
    }

    const downloadIndex = parseInt(index)
    if (isNaN(downloadIndex) || downloadIndex < 0 || downloadIndex >= definition.downloads.length) {
      return respond.error(res, 400, 'invalid_index', 'Invalid download index')
    }

    const removed = definition.downloads.splice(downloadIndex, 1)[0]
    definition.updatedBy = req._userId
    definition.addChangeLog('updated', req._userId, { removedDownload: removed.label })

    await definition.save()

    return res.json({ success: true, removed, definition })
  } catch (err) {
    console.error('DELETE /api/admin/forms/:id/downloads/:index error:', err)
    return respond.error(res, 500, 'remove_download_failed', 'Failed to remove download')
  }
})

module.exports = router
