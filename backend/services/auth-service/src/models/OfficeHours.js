const mongoose = require('mongoose')

/**
 * Office Hours Model
 * Defines working hours for each office/department
 * Used to detect suspicious activity (e.g., recovery requests outside office hours)
 */
const OfficeHoursSchema = new mongoose.Schema(
  {
    office: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Manila', // Default to Philippines timezone
      required: true,
    },
    // Working hours for each day of the week (0 = Sunday, 6 = Saturday)
    monday: {
      start: { type: String, default: '08:00' }, // HH:mm format
      end: { type: String, default: '17:00' },
      isWorkingDay: { type: Boolean, default: true },
    },
    tuesday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
      isWorkingDay: { type: Boolean, default: true },
    },
    wednesday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
      isWorkingDay: { type: Boolean, default: true },
    },
    thursday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
      isWorkingDay: { type: Boolean, default: true },
    },
    friday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
      isWorkingDay: { type: Boolean, default: true },
    },
    saturday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '12:00' },
      isWorkingDay: { type: Boolean, default: false },
    },
    sunday: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '12:00' },
      isWorkingDay: { type: Boolean, default: false },
    },
    // Special dates (holidays, etc.)
    exceptions: [
      {
        date: { type: Date, required: true },
        isWorkingDay: { type: Boolean, required: true },
        start: { type: String },
        end: { type: String },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
)

// Index for efficient lookup
OfficeHoursSchema.index({ office: 1 })

module.exports = mongoose.models.OfficeHours || mongoose.model('OfficeHours', OfficeHoursSchema)
