const mongoose = require('mongoose')

const CustomerAddressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
)

CustomerAddressSchema.index({ userId: 1, isPrimary: 1 })

module.exports = mongoose.model('CustomerAddress', CustomerAddressSchema)