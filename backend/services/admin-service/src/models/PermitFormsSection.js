const mongoose = require('mongoose')

const PermitFormCardSchema = new mongoose.Schema({
  cardId: { type: String, required: true },
  title: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  requirements: [{ type: String, trim: true }],
  downloadableFile: {
    cid: { type: String, default: '' },
    fileName: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  processingSteps: [{
    stepId: { type: String, required: true },
    title: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    estimatedDurationDays: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
  }],
  lastUpdatedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
}, { _id: false })

const PermitFormsSectionSchema = new mongoose.Schema({
  sectionDescription: { type: String, default: '' },
  cards: { type: [PermitFormCardSchema], default: [] },
  publishedSectionDescription: { type: String, default: '' },
  publishedCards: { type: [PermitFormCardSchema], default: [] },
  isPublished: { type: Boolean, default: false },
  lastPublishedAt: { type: Date, default: null },
  isEnabled: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
PermitFormsSectionSchema.plugin(encryptionPlugin, {
  fields: ['sectionDescription', 'publishedSectionDescription'],
  deterministicFields: [],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
})

module.exports = mongoose.models.PermitFormsSection || mongoose.model('PermitFormsSection', PermitFormsSectionSchema)
