const mongoose = require('mongoose')
const { GENERAL_PERMIT_CATEGORY_VALUES } = require('../../../../shared/constants')

const RequirementSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    type: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
)

const GeneralPermitSchema = new mongoose.Schema(
  {
    permitCategory: {
      type: String,
      enum: GENERAL_PERMIT_CATEGORY_VALUES,
      required: true,
    },
    requirements: {
      type: [RequirementSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft',
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    businessPlateNo: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

module.exports =
  mongoose.models.GeneralPermit ||
  mongoose.model('GeneralPermit', GeneralPermitSchema)
