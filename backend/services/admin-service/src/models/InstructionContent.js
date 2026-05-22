const mongoose = require('mongoose')

const BulletPointSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
}, { _id: false })

const FaqItemSchema = new mongoose.Schema({
  key: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false })

const InstructionContentSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  bulletPoints: { type: [BulletPointSchema], default: [] },
  faqItems: { type: [FaqItemSchema], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Draft/publish fields
  isPublished: { type: Boolean, default: true },
  draftData: {
    description: { type: String, default: '' },
    bulletPoints: { type: [BulletPointSchema], default: [] },
    faqItems: { type: [FaqItemSchema], default: [] },
  },
  publishedData: {
    description: { type: String, default: '' },
    bulletPoints: { type: [BulletPointSchema], default: [] },
    faqItems: { type: [FaqItemSchema], default: [] },
  },
}, { timestamps: true })

InstructionContentSchema.index({ slotId: 1 })

module.exports = mongoose.model('InstructionContent', InstructionContentSchema)
