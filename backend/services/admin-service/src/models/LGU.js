const mongoose = require('mongoose')

const LGUSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Code must be alphanumeric with hyphens only'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['city', 'municipality'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Index for efficient queries
LGUSchema.index({ isActive: 1 })
LGUSchema.index({ region: 1 })
LGUSchema.index({ type: 1 })

module.exports = mongoose.model('LGU', LGUSchema)
