const PostRequirement = require('../models/PostRequirement')

/**
 * Finds pending post-requirements past their due date and marks them overdue.
 * Designed to run daily. Idempotent — already-overdue records are skipped by the filter.
 */
async function markOverduePostRequirements() {
  const now = new Date()
  const result = await PostRequirement.updateMany(
    { status: 'pending', dueDate: { $lt: now } },
    { $set: { status: 'overdue' } },
  )
  return { marked: result.modifiedCount }
}

module.exports = { markOverduePostRequirements }
