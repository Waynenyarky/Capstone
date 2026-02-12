const mongoose = require('mongoose')
const { INDUSTRY_SCOPE_VALUES, getIndustryScopeLabel } = require('../../../../shared/constants')

const FormGroupSchema = new mongoose.Schema(
  {
    formType: {
      type: String,
      enum: ['registration', 'permit', 'renewal', 'cessation', 'violation', 'appeal', 'inspections'],
      required: true,
      index: true,
    },
    industryScope: {
      type: String,
      enum: INDUSTRY_SCOPE_VALUES,
      default: 'all',
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    retiredAt: {
      type: Date,
      default: null,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    deactivatedUntil: {
      type: Date,
      default: null,
    },
    deactivateReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
)

FormGroupSchema.index({ formType: 1, industryScope: 1 }, { unique: true })
FormGroupSchema.index({ retiredAt: 1 })

FormGroupSchema.statics.getIndustryScopeLabel = function (scope) {
  return getIndustryScopeLabel(scope)
}

FormGroupSchema.statics.getFormTypeLabel = function (formType) {
  const labels = {
    registration: 'Business Registration',
    permit: 'Business Permit',
    renewal: 'Business Renewal',
    cessation: 'Cessation',
    violation: 'Violation',
    appeal: 'Appeal',
    inspections: 'Inspections',
  }
  return labels[formType] || formType
}

FormGroupSchema.methods.computeDisplayName = function () {
  const typeLabel = this.constructor.getFormTypeLabel(this.formType)
  const scopeLabel = this.constructor.getIndustryScopeLabel(this.industryScope)
  return `${typeLabel} - ${scopeLabel}`
}

module.exports = mongoose.model('FormGroup', FormGroupSchema)
