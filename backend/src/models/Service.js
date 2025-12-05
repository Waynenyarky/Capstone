const mongoose = require('mongoose')

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    status: { type: String, default: 'active' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    // Pricing configuration: admin controls whether providers can offer fixed, hourly, or both
    pricingMode: { type: String, enum: ['fixed', 'hourly', 'both'], default: 'fixed' },
    // Price range (optional) — store minimum and maximum suggested prices
    priceMin: { type: Number, default: null },
    priceMax: { type: Number, default: null },
    // Hourly rate range (optional) — store minimum and maximum suggested hourly rates
    hourlyRateMin: { type: Number, default: null },
    hourlyRateMax: { type: Number, default: null },
    image: {
      filename: { type: String },
      dataURL: { type: String }, // Dev-friendly: store base64; replace with proper storage in production
      contentType: { type: String },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Service', ServiceSchema)