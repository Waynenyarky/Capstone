/**
 * IP Tracker Service
 * Tracks and analyzes IP addresses for suspicious activity detection
 */

const User = require('../models/User')

const MAX_RECENT_IPS = 10 // Keep last 10 login IPs

/**
 * Track IP address for a user
 * @param {string} userId - User ID
 * @param {string} ipAddress - IP address
 * @param {string} location - Optional geolocation data
 * @returns {Promise<void>}
 */
async function trackIP(userId, ipAddress, location = '') {
  try {
    const user = await User.findById(userId)
    if (!user) return

    const recentIPs = user.recentLoginIPs || []
    
    // Add new IP to the beginning
    recentIPs.unshift({
      ip: ipAddress,
      timestamp: new Date(),
      location: location || '',
    })

    // Keep only last MAX_RECENT_IPS
    if (recentIPs.length > MAX_RECENT_IPS) {
      recentIPs.splice(MAX_RECENT_IPS)
    }

    user.recentLoginIPs = recentIPs
    await user.save()
  } catch (error) {
    console.error('Error tracking IP:', error)
    // Don't throw - IP tracking failure shouldn't break operations
  }
}

/**
 * Check if IP address is unusual compared to recent logins
 * @param {string} userId - User ID
 * @param {string} ipAddress - IP address to check
 * @returns {Promise<{isUnusual: boolean, reason?: string, recentIPs: Array}>}
 */
async function isUnusualIP(userId, ipAddress) {
  try {
    const user = await User.findById(userId).select('recentLoginIPs').lean()
    if (!user || !user.recentLoginIPs || user.recentLoginIPs.length === 0) {
      // No history, can't determine if unusual
      return { isUnusual: false, recentIPs: [] }
    }

    const recentIPs = user.recentLoginIPs.slice(0, 5) // Check last 5 IPs
    
    // Check if IP matches any recent IPs
    const matchesRecent = recentIPs.some((entry) => entry.ip === ipAddress)
    
    if (matchesRecent) {
      return { isUnusual: false, recentIPs }
    }

    // IP is different from recent IPs - could be unusual
    // For now, we'll flag it as potentially unusual
    // In production, you might want to do geolocation comparison
    return {
      isUnusual: true,
      reason: 'IP address differs from recent login locations',
      recentIPs,
    }
  } catch (error) {
    console.error('Error checking unusual IP:', error)
    return { isUnusual: false, recentIPs: [] }
  }
}

/**
 * Get recent IPs for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getRecentIPs(userId) {
  try {
    const user = await User.findById(userId).select('recentLoginIPs').lean()
    return user?.recentLoginIPs || []
  } catch (error) {
    console.error('Error getting recent IPs:', error)
    return []
  }
}

module.exports = {
  trackIP,
  isUnusualIP,
  getRecentIPs,
}
