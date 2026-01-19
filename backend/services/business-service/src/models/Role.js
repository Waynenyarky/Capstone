const mongoose = require('mongoose')

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: String }], // Future-proofing for granular permissions
  },
  { timestamps: true }
)

module.exports = mongoose.model('Role', RoleSchema)
