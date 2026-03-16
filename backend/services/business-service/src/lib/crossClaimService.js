/**
 * Cross-Claim Service
 * When an officer claims/releases/transfers ANY request for a business,
 * all other pending requests for the same business are automatically
 * claimed/released/transferred to the same officer.
 */
const mongoose = require('mongoose')
const EditRequest = require('../models/EditRequest')
const Appeal = require('../models/Appeal')
const BusinessProfile = require('../models/BusinessProfile')

function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || '')
  const clauses = [{ 'businesses.businessId': target }]
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ 'businesses._id': new mongoose.Types.ObjectId(target) })
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses }
}

/**
 * Cross-claim all pending requests for a business.
 * @param {string} businessId
 * @param {string|null} officerId - null for release
 * @param {object} options
 * @param {string} options.skipModel - 'EditRequest'|'Appeal'|'BusinessProfile'|'PermitApplication' to skip (the caller already handled it)
 * @param {string} options.skipId - specific document _id to skip (the item that triggered cross-claim)
 */
async function crossClaimForBusiness(businessId, officerId, options = {}) {
  const { skipModel, skipId } = options
  const results = { editRequests: 0, appeals: 0, retirement: false, application: false }

  try {
    // 1. Claim/release open EditRequests for this business
    if (skipModel !== 'EditRequest') {
      const editFilter = {
        businessId: String(businessId),
        status: 'pending',
      }
      if (skipModel === 'EditRequest' && skipId) {
        editFilter._id = { $ne: skipId }
      }
      const editResult = await EditRequest.updateMany(
        editFilter,
        { $set: { reviewedBy: officerId } }
      )
      results.editRequests = editResult.modifiedCount || 0
    }

    // 2. Claim/release open Appeals for this business
    if (skipModel !== 'Appeal') {
      const appealFilter = {
        businessId: String(businessId),
        status: { $in: ['submitted', 'under_review'] },
      }
      if (skipModel === 'Appeal' && skipId) {
        appealFilter._id = { $ne: skipId }
      }
      const appealResult = await Appeal.updateMany(
        appealFilter,
        { $set: { reviewedBy: officerId } }
      )
      results.appeals = appealResult.modifiedCount || 0
    }

    // 3. Claim/release the retirement entry (reviewedBy on the business subdoc)
    if (skipModel !== 'Retirement') {
      const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
      if (profile) {
        const target = String(businessId)
        const business = profile.businesses.find(
          b => String(b.businessId || '') === target || String(b._id || '') === target
        )
        if (business && business.retirementStatus && !['confirmed', 'rejected'].includes(business.retirementStatus)) {
          business.reviewedBy = officerId
          business.updatedAt = new Date()
          profile.markModified('businesses')
          await profile.save()
          results.retirement = true
        }
      }
    }

    // 4. Claim/release the permit application (reviewedBy on the business subdoc)
    if (skipModel !== 'PermitApplication') {
      const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
      if (profile) {
        const target = String(businessId)
        const businessIndex = profile.businesses.findIndex(
          b => String(b.businessId || '') === target || String(b._id || '') === target
        )
        if (businessIndex !== -1) {
          const business = profile.businesses[businessIndex]
          const appStatus = business.applicationStatus || ''
          const claimableStatuses = ['submitted', 'resubmit', 'under_review', 'appeal_pending']
          if (claimableStatuses.includes(appStatus)) {
            profile.businesses[businessIndex].reviewedBy = officerId
            profile.businesses[businessIndex].updatedAt = new Date()
            profile.markModified('businesses')
            await profile.save()
            results.application = true
          }
        }
      }
    }
  } catch (err) {
    console.error('[crossClaimService] Error during cross-claim:', err)
  }

  return results
}

module.exports = { crossClaimForBusiness }
