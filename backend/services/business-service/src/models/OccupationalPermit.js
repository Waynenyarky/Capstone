const mongoose = require('mongoose')
const { LAB_EXAM_TYPE_VALUES } = require('../../../../shared/constants')

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    barangay: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode: { type: String, default: '' },
  },
  { _id: false }
)

const DocumentStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
    },
    documentUrl: { type: String, default: '' },
  },
  { _id: false }
)

const PisStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'registered', 'verified'],
      default: 'pending',
    },
  },
  { _id: false }
)

const LabExamResultSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'complete', 'failed'],
      default: 'pending',
    },
    result: { type: String, default: '' },
    updatedAt: { type: Date, default: null },
  },
  { _id: false }
)

const OccupationalPermitSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    civilStatus: {
      type: String,
      enum: ['single', 'married', 'widowed', 'separated', ''],
      default: '',
    },
    dateOfBirth: { type: Date, default: null },
    address: {
      type: AddressSchema,
      default: () => ({}),
    },
    education: { type: String, default: '' },

    // Employment details
    businessPlateNo: { type: String, required: true },
    employer: { type: String, default: '' },
    company: { type: String, default: '' },
    position: { type: String, default: '' },
    type: {
      type: String,
      enum: ['self_employed', 'employed'],
      default: 'employed',
    },

    // Pre-requirements
    preRequirements: {
      barangayClearance: {
        type: DocumentStatusSchema,
        default: () => ({}),
      },
      ctc: {
        type: DocumentStatusSchema,
        default: () => ({}),
      },
      pisRegistration: {
        type: PisStatusSchema,
        default: () => ({}),
      },
    },

    // Lab exams - Map keyed by exam type (e.g. 'urinalysis', 'xray')
    labExams: {
      type: Map,
      of: LabExamResultSchema,
      default: () => new Map(),
    },

    // Overall permit status
    status: {
      type: String,
      enum: ['pending', 'lab_pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

module.exports =
  mongoose.models.OccupationalPermit ||
  mongoose.model('OccupationalPermit', OccupationalPermitSchema)
