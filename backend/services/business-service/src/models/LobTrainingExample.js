const mongoose = require('mongoose')

const LobTrainingExampleSchema = new mongoose.Schema(
  {
    businessDescription: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    taxCode: {
      type: String,
      required: true,
    },
    lineOfBusiness: {
      type: String,
      required: true,
    },
    detailedLine: {
      type: String,
      required: true,
    },
    psicCode: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

LobTrainingExampleSchema.index({ taxCode: 1, detailedLine: 1 })
LobTrainingExampleSchema.index({ createdAt: -1 })

module.exports = mongoose.models.LobTrainingExample || mongoose.model('LobTrainingExample', LobTrainingExampleSchema)
