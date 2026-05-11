const mongoose = require('mongoose')

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  body: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  isActive: { type: Boolean, default: true },
  publishAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

AnnouncementSchema.index({ isActive: 1, createdAt: -1 })
AnnouncementSchema.index({ 'metadata.maintenanceApprovalId': 1 })

module.exports = mongoose.model('Announcement', AnnouncementSchema)
