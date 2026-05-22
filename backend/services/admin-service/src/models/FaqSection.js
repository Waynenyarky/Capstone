const mongoose = require('mongoose')

const FaqItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false })

const FaqSectionSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, trim: true, default: '' },
  subtitle: { type: String, default: '' },
  items: { type: [FaqItemSchema], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Draft/publish fields
  isPublished: { type: Boolean, default: true },
  draftData: {
    subtitle: { type: String, default: '' },
    items: { type: [FaqItemSchema], default: [] },
  },
  publishedData: {
    subtitle: { type: String, default: '' },
    items: { type: [FaqItemSchema], default: [] },
  },
}, { timestamps: true })

FaqSectionSchema.index({ slotId: 1 })

module.exports = mongoose.model('FaqSection', FaqSectionSchema)
