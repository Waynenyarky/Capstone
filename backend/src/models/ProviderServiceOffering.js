const mongoose = require('mongoose')

const DayAvailabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['mon','tue','wed','thu','fri','sat','sun'], required: true },
    available: { type: Boolean, default: false },
    startTime: { type: String, default: null }, // 'HH:mm'
    endTime: { type: String, default: null },   // 'HH:mm'
  },
  { _id: false }
)

const ProviderServiceOfferingSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    pricingMode: { type: String, enum: ['fixed', 'hourly', 'both'], default: 'fixed' },
    fixedPrice: { type: Number, default: null },
    hourlyRate: { type: Number, default: null },
    availability: { type: [DayAvailabilitySchema], default: [] },
    emergencyAvailable: { type: Boolean, default: false },
    providerDescription: { type: String, default: '' },
    active: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'active', 'inactive'], default: 'draft' },
  },
  { timestamps: true }
)

// Ensure a provider cannot create duplicate offerings for the same service
ProviderServiceOfferingSchema.index({ providerId: 1, serviceId: 1 }, { unique: true })

module.exports = mongoose.model('ProviderServiceOffering', ProviderServiceOfferingSchema)