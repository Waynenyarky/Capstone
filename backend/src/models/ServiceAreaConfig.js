const mongoose = require('mongoose')

const ProvinceCitiesSchema = new mongoose.Schema({
  province: { type: String, required: true },
  cities: { type: [String], default: [] },
  // Whether this province is currently active/supported
  active: { type: Boolean, default: true },
}, { _id: false })

const ServiceAreaConfigSchema = new mongoose.Schema({
  // List of supported provinces and their allowed cities
  areas: { type: [ProvinceCitiesSchema], default: [] },
}, { timestamps: true })

module.exports = mongoose.model('ServiceAreaConfig', ServiceAreaConfigSchema)