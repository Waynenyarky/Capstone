const mongoose = require('mongoose')
const { INDUSTRY_SCOPE_VALUES, BUSINESS_TYPE_VALUES } = require('../../../../shared/constants')

// Valid field types for form builder items
const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'multiselect', 'file', 'download', 'checkbox', 'address']

// Schema for individual requirement items (expanded for form builder)
const RequirementItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    required: { type: Boolean, default: true },
    notes: { type: String, default: '' },

    // Field type (defaults to 'file' for backward compat with legacy items)
    type: { type: String, enum: FIELD_TYPES, default: 'file' },

    // Storage key for form-driven UIs (e.g. idPicture, mayorsPermit); empty = frontend derives slug from label
    key: { type: String, trim: true, default: '' },

    // Display / UX
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    span: { type: Number, default: 24, min: 1, max: 24 },

    // Validation rules (flexible object: minLength, maxLength, pattern, minValue, maxValue, maxFileSize, acceptedFileTypes, etc.)
    validation: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Dropdown configuration
    dropdownSource: { type: String, default: 'static' }, // static | psgc_province | psgc_city | psgc_barangay | industries
    dropdownOptions: [{ type: String }], // for static source

    // Download field: template file that applicants download, fill, and re-upload
    downloadFileName: { type: String, default: '' },
    downloadFileSize: { type: Number, default: 0 },
    downloadFileType: { type: String, default: '' },
    downloadFileUrl: { type: String, default: '' },
    downloadIpfsCid: { type: String, default: '' },
  },
  { _id: false }
)

// Schema for requirement sections
const SectionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    source: { type: String, default: '' },
    items: [RequirementItemSchema],
    notes: { type: String, default: '' },
  },
  { _id: false }
)

// Schema for downloadable templates
const DownloadSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    fileUrl: { type: String, required: true },
    ipfsCid: { type: String, default: '' },
    fileType: { type: String, default: 'pdf' },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

// Schema for change log entries
const ChangeLogEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted_for_approval', 'published', 'archived', 'rejected'],
      required: true,
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
    changes: { type: mongoose.Schema.Types.Mixed, default: {} },
    comment: { type: String, default: '' },
    system: { type: String, default: null }, // For system-generated entries (e.g., 'Seeder')
  },
  { _id: false }
)

const FormDefinitionSchema = new mongoose.Schema(
  {
    // Link to form group (form with multiple versions)
    formGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormGroup',
      default: null,
      index: true,
    },

    // Form type
    formType: {
      type: String,
      enum: ['registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal', 'inspections'],
      required: true,
      index: true,
    },

    // Version identifier (e.g., '2026.1' = year.versionNumber)
    version: {
      type: String,
      required: true,
      trim: true,
    },

    // Status workflow
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'archived'],
      default: 'draft',
      index: true,
    },

    // Industry scope: 'all' or specific business type (denormalized from group)
    industryScope: {
      type: String,
      enum: INDUSTRY_SCOPE_VALUES,
      default: 'all',
      index: true,
    },

    // Display name (auto from formType + industryScope; kept for backwards compatibility)
    name: {
      type: String,
      trim: true,
      default: '',
    },

    // Description for admin reference
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Targeting - Business Types (empty array = all types)
    businessTypes: [{
      type: String,
      enum: BUSINESS_TYPE_VALUES,
    }],

    // Targeting - LGU Codes (empty array = all LGUs / global)
    lguCodes: [{
      type: String,
      uppercase: true,
      trim: true,
    }],

    // Content - Requirement sections
    sections: [SectionSchema],

    // Downloadable templates
    downloads: [DownloadSchema],

    // Scheduling
    effectiveFrom: {
      type: Date,
      default: null,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },

    // Approval integration
    approvalId: {
      type: String,
      default: '',
      index: true,
    },

    // Publishing metadata
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeLog: [ChangeLogEntrySchema],
  },
  { timestamps: true }
)

// Compound indexes for efficient queries
FormDefinitionSchema.index({ formType: 1, status: 1 })
FormDefinitionSchema.index({ formType: 1, status: 1, effectiveFrom: 1 })
FormDefinitionSchema.index({ formGroupId: 1, version: 1 })
FormDefinitionSchema.index({ businessTypes: 1 })
FormDefinitionSchema.index({ lguCodes: 1 })
FormDefinitionSchema.index({ createdAt: -1 })

// Static method to find the active (published) definition for given criteria
FormDefinitionSchema.statics.findActiveDefinition = async function (formType, businessType, lguCode) {
  const now = new Date()

  // Find all published definitions for this form type that are effective
  const definitions = await this.find({
    formType,
    status: 'published',
    $or: [
      { effectiveFrom: null },
      { effectiveFrom: { $lte: now } },
    ],
  }).and([
    {
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gt: now } },
      ],
    },
  ]).lean()

  if (!definitions || definitions.length === 0) {
    return null
  }

  // Score each definition by specificity
  const scored = definitions.map((def) => {
    let score = 0

    // Business type matching
    const hasBusinessTypes = def.businessTypes && def.businessTypes.length > 0
    const matchesBusinessType = hasBusinessTypes && businessType && def.businessTypes.includes(businessType)
    
    // LGU matching
    const hasLguCodes = def.lguCodes && def.lguCodes.length > 0
    const matchesLgu = hasLguCodes && lguCode && def.lguCodes.includes(lguCode.toUpperCase())

    // Scoring logic:
    // - Exact match on both: 3
    // - Exact match on business type only: 2
    // - Exact match on LGU only: 1
    // - Global (no targeting): 0
    // - Has targeting but doesn't match: -1 (exclude)

    if (hasBusinessTypes && businessType && !matchesBusinessType) {
      score = -1 // Exclude - doesn't match business type filter
    } else if (hasLguCodes && lguCode && !matchesLgu) {
      score = -1 // Exclude - doesn't match LGU filter
    } else if (matchesBusinessType && matchesLgu) {
      score = 3
    } else if (matchesBusinessType) {
      score = 2
    } else if (matchesLgu) {
      score = 1
    } else {
      score = 0 // Global/default
    }

    return { definition: def, score }
  })

  // Filter out excluded and sort by score (highest first)
  const eligible = scored.filter((s) => s.score >= 0).sort((a, b) => b.score - a.score)

  return eligible.length > 0 ? eligible[0].definition : null
}

// Instance method to add a change log entry
FormDefinitionSchema.methods.addChangeLog = function (action, userId, changes = {}, comment = '') {
  this.changeLog.push({
    action,
    by: userId,
    at: new Date(),
    changes,
    comment,
  })
}

// Instance method to check if definition can be edited
FormDefinitionSchema.methods.canEdit = function () {
  return this.status === 'draft'
}

// Instance method to check if definition can be submitted for approval
FormDefinitionSchema.methods.canSubmitForApproval = function () {
  return this.status === 'draft' && this.sections && this.sections.length > 0
}

// Instance method to check if definition can be archived
FormDefinitionSchema.methods.canArchive = function () {
  return this.status === 'published' || this.status === 'draft'
}

module.exports = mongoose.model('FormDefinition', FormDefinitionSchema)
