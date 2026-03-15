const mongoose = require('mongoose')

const OfficeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    group: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
OfficeSchema.plugin(encryptionPlugin, {
  fields: ['name', 'group'],
  deterministicFields: ['code'],
  nestedPaths: [],
  arrayPaths: [],
  mixedPaths: [],
})

module.exports = mongoose.models.Office || mongoose.model('Office', OfficeSchema)
