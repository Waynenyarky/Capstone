const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema(
  {
    icon: { type: String, default: null },
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Category', CategorySchema)