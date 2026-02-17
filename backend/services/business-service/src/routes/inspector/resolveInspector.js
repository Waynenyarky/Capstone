const mongoose = require('mongoose')

const TEST_INSPECTOR_EMAIL = 'waynenrq@gmail.com'

function toObjectId (userId) {
  if (!userId) return userId
  if (mongoose.Types.ObjectId.isValid(userId)) return new mongoose.Types.ObjectId(userId)
  return userId
}

/**
 * Resolve the effective inspector id for API queries.
 * For the test account waynenrq@gmail.com, always use the user found by email
 * so seed data (which uses that user's _id) is returned in the mobile app.
 */
async function getEffectiveInspectorId (req) {
  let id = toObjectId(req._userId)
  if (req._userEmail === TEST_INSPECTOR_EMAIL) {
    const User = require('../../models/User')
    const u = await User.findOne({ email: TEST_INSPECTOR_EMAIL }).select('_id').lean()
    if (u) id = u._id
  }
  return id
}

module.exports = { getEffectiveInspectorId, toObjectId, TEST_INSPECTOR_EMAIL }
