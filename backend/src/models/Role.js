const mongoose = require('mongoose')

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    displayName: { type: String, default: '' },
    isStaffRole: { type: Boolean, default: false },
    permissions: [{ type: String }], // Future-proofing for granular permissions
  },
  { timestamps: true }
)

module.exports = mongoose.models.Role || mongoose.model('Role', RoleSchema)
