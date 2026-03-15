const mongoose = require('mongoose')

const RecommendationFeedbackItemSchema = new mongoose.Schema(
  {
    taxCode: { type: String, required: true },
    lineOfBusiness: { type: String, required: true },
    detailedLine: { type: String, required: true },
    accepted: { type: Boolean, required: true },
    acceptedWithEdits: { type: Boolean, default: false },
  },
  { _id: false }
)

const LobRecommendationFeedbackSchema = new mongoose.Schema(
  {
    businessDescription: {
      type: String,
      default: '',
      maxlength: 500,
    },
    recommendations: {
      type: [RecommendationFeedbackItemSchema],
      required: true,
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length > 0 && v.every(r => typeof r.accepted === 'boolean')
        },
        message: 'recommendations must be a non-empty array with accepted boolean per item',
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
LobRecommendationFeedbackSchema.plugin(encryptionPlugin, {
  fields: ['businessDescription'],
  deterministicFields: [],
  nestedPaths: [],
  arrayPaths: ['recommendations'],
  mixedPaths: [],
})

LobRecommendationFeedbackSchema.index({ createdAt: -1 })
LobRecommendationFeedbackSchema.index({ userId: 1, createdAt: -1 })

module.exports =
  mongoose.models.LobRecommendationFeedback ||
  mongoose.model('LobRecommendationFeedback', LobRecommendationFeedbackSchema)
