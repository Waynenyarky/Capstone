const mongoose = require('mongoose')

const PenaltyConfigurationSchema = new mongoose.Schema(
  {
    surchargePercentage: { type: Number, required: true, default: 25 }, // 25%
    monthlyInterestRate: { type: Number, required: true, default: 2 }, // 2%
    penaltyStartDay: {
      type: Number,
      required: true,
      default: 20,
      min: 1,
      max: 31,
    }, // Penalty applies if past January <penaltyStartDay>
    compliancePeriods: {
      type: Map,
      of: Number, // violation type -> days
      default: {},
    },
    effectiveDate: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

// Ensure only one active configuration at a time
// NOTE: Mongoose 9 async pre-hooks must NOT call next(); just return/throw.
PenaltyConfigurationSchema.pre('save', async function () {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate all other active configs
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } }
    )
  }
})

module.exports =
  mongoose.models.PenaltyConfiguration ||
  mongoose.model('PenaltyConfiguration', PenaltyConfigurationSchema)
