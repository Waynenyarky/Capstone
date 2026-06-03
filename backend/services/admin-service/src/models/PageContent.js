const mongoose = require('mongoose')

const SectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
}, { _id: false })

const PageContentSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, trim: true, default: '' },
  effectiveDate: { type: String, default: '' },
  introText: { type: String, default: '' },
  sections: { type: [SectionSchema], default: [] },
  footerLabel: { type: String, default: '' },
  footerText: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Draft/publish fields
  isPublished: { type: Boolean, default: true },
  draftData: {
    effectiveDate: { type: String, default: '' },
    introText: { type: String, default: '' },
    sections: { type: [SectionSchema], default: [] },
    footerLabel: { type: String, default: '' },
    footerText: { type: String, default: '' },
  },
  publishedData: {
    effectiveDate: { type: String, default: '' },
    introText: { type: String, default: '' },
    sections: { type: [SectionSchema], default: [] },
    footerLabel: { type: String, default: '' },
    footerText: { type: String, default: '' },
  },
}, { timestamps: true })

PageContentSchema.index({ slotId: 1 })

module.exports = mongoose.model('PageContent', PageContentSchema)
