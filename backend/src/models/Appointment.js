const mongoose = require('mongoose')

const AppointmentSchema = new mongoose.Schema(
  {
    // Actors
    customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    offeringId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderServiceOffering', required: true },
    // Context
    serviceAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAddress', required: true },
    appointmentAt: { type: Date, required: true },
    notes: { type: String, default: '' },
    pricingSelection: { type: String, enum: ['fixed', 'hourly'], required: true },
    estimatedHours: { type: Number, default: null },
    // Lifecycle
    status: { type: String, enum: ['requested', 'accepted', 'declined', 'cancelled', 'completed'], default: 'requested' },
    reviewedAt: { type: Date, default: null },
    reviewedByEmail: { type: String, default: '' },
    reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decisionNotes: { type: String, default: '' },
    // Audit
    createdByEmail: { type: String, default: '' },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

AppointmentSchema.index({ customerUserId: 1, appointmentAt: 1 })
AppointmentSchema.index({ providerId: 1, appointmentAt: 1 })

module.exports = mongoose.model('Appointment', AppointmentSchema)