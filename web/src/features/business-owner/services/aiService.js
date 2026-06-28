import { post } from '@/lib/http.js'

const BASE_PATH = '/api/business/ai'

/**
 * Get AI line of business recommendation
 * @param {string} businessDescription - Business description to analyze
 * @param {object} options - Additional options like timeout
 * @returns {Promise<object>} AI recommendation response
 */
export async function recommendLineOfBusiness(businessDescription, options = {}) {
  return post(`${BASE_PATH}/recommend-line-of-business`, 
    { businessDescription: businessDescription.trim() }, 
    options
  )
}

/**
 * Submit LOB feedback to improve AI model
 * @param {object} feedbackData - Feedback data including original description and corrected LOB
 * @returns {Promise<object>} Feedback submission response
 */
export async function submitLobFeedback(feedbackData) {
  return post(`${BASE_PATH}/lob-feedback`, feedbackData)
}
