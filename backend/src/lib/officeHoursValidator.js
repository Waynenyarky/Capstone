/**
 * Office Hours Validator
 * Validates if a request is within office working hours
 */

const OfficeHours = require('../models/OfficeHours')

/**
 * Check if current time is within office working hours
 * @param {string} office - Office name
 * @param {Date} checkTime - Time to check (defaults to now)
 * @returns {Promise<{isWithinHours: boolean, reason?: string}>}
 */
async function isWithinOfficeHours(office, checkTime = new Date()) {
  try {
    const officeHours = await OfficeHours.findOne({ office }).lean()
    
    if (!officeHours) {
      // If no office hours configured, default to allowing (business hours: Mon-Fri 8am-5pm)
      const day = checkTime.getDay()
      const hour = checkTime.getHours()
      const isWeekday = day >= 1 && day <= 5
      const isBusinessHours = hour >= 8 && hour < 17
      
      return {
        isWithinHours: isWeekday && isBusinessHours,
        reason: !officeHours ? 'No office hours configured, using default business hours' : undefined,
      }
    }

    // Check exceptions first (holidays, special dates)
    const dateStr = checkTime.toISOString().split('T')[0]
    const exception = officeHours.exceptions?.find(
      (exc) => exc.date.toISOString().split('T')[0] === dateStr
    )
    
    if (exception) {
      if (!exception.isWorkingDay) {
        return { isWithinHours: false, reason: `Holiday/exception: ${exception.reason || 'Non-working day'}` }
      }
      // Check if within exception hours
      if (exception.start && exception.end) {
        const isWithin = isTimeWithinRange(checkTime, exception.start, exception.end)
        return {
          isWithinHours: isWithin,
          reason: isWithin ? undefined : `Outside exception hours (${exception.start}-${exception.end})`,
        }
      }
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = checkTime.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayConfig = officeHours[dayNames[dayOfWeek]]

    if (!dayConfig || !dayConfig.isWorkingDay) {
      return { isWithinHours: false, reason: `${dayNames[dayOfWeek]} is not a working day` }
    }

    // Check if within working hours
    const isWithin = isTimeWithinRange(checkTime, dayConfig.start, dayConfig.end)
    
    return {
      isWithinHours: isWithin,
      reason: isWithin ? undefined : `Outside working hours (${dayConfig.start}-${dayConfig.end})`,
    }
  } catch (error) {
    console.error('Error checking office hours:', error)
    // On error, default to allowing (fail open)
    return { isWithinHours: true, reason: 'Error checking office hours, defaulting to allowed' }
  }
}

/**
 * Check if time is within a time range (HH:mm format)
 * @param {Date} checkTime - Time to check
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @returns {boolean}
 */
function isTimeWithinRange(checkTime, startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const checkHour = checkTime.getHours()
  const checkMin = checkTime.getMinutes()
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const checkMinutes = checkHour * 60 + checkMin
  
  return checkMinutes >= startMinutes && checkMinutes < endMinutes
}

/**
 * Get office hours configuration for an office
 * @param {string} office - Office name
 * @returns {Promise<Object|null>}
 */
async function getOfficeHours(office) {
  try {
    return await OfficeHours.findOne({ office }).lean()
  } catch (error) {
    console.error('Error getting office hours:', error)
    return null
  }
}

module.exports = {
  isWithinOfficeHours,
  getOfficeHours,
  isTimeWithinRange,
}
