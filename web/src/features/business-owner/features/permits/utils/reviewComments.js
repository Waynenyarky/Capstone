/**
 * Parse backend review/comments payload into display-friendly shape.
 * Handles applicationStatus, reviewComments, rejectionReason, and "Required Changes:" separator.
 */
export function parseReviewComments(statusData, record, fallbackToRecord = false) {
  const data = fallbackToRecord ? record : statusData
  const applicationStatus = statusData?.applicationStatus || statusData?.status || record?.status
  const reviewCommentsRaw = statusData?.reviewComments ?? statusData?.comments ?? statusData?.review?.comments ?? record?.reviewComments
  const rejectionReasonRaw = statusData?.rejectionReason ?? statusData?.review?.rejectionReason ?? record?.rejectionReason
  const directComments = statusData?.comments ?? statusData?.review?.comments ?? null
  const directRequiredChanges = statusData?.requestChangesMessage ?? statusData?.review?.requestChangesMessage ?? statusData?.requiredChangesMessage ?? null
  const reviewCommentsObject = typeof reviewCommentsRaw === 'object' && reviewCommentsRaw !== null ? reviewCommentsRaw : null

  let combinedReviewComments = reviewCommentsRaw
  if (!combinedReviewComments && (directComments || directRequiredChanges)) {
    combinedReviewComments = directRequiredChanges ? `${directComments || ''}\n\nRequired Changes:\n${directRequiredChanges}` : directComments
  }
  if (reviewCommentsObject) {
    const objComments = reviewCommentsObject.comments ?? reviewCommentsObject.reviewComments ?? null
    const objRequired = reviewCommentsObject.requestChangesMessage ?? reviewCommentsObject.requiredChangesMessage ?? null
    combinedReviewComments = objRequired ? `${objComments || ''}\n\nRequired Changes:\n${objRequired}` : (objComments || combinedReviewComments)
  }

  const reviewCommentsValue = combinedReviewComments != null ? (typeof combinedReviewComments === 'string' ? combinedReviewComments.trim() : String(combinedReviewComments).trim()) : null
  const rejectionReasonValue = rejectionReasonRaw != null ? (typeof rejectionReasonRaw === 'string' ? rejectionReasonRaw.trim() : String(rejectionReasonRaw).trim()) : null
  const finalReviewComments = (reviewCommentsValue?.length > 0) ? reviewCommentsValue : null
  const finalRejectionReason = (rejectionReasonValue?.length > 0) ? rejectionReasonValue : null
  const reviewCommentsForParsing = finalReviewComments

  let generalComments = null
  let requiredChanges = null

  if (applicationStatus === 'needs_revision' && reviewCommentsForParsing) {
    const separatorIndex = reviewCommentsForParsing.indexOf('\n\nRequired Changes:')
    if (separatorIndex !== -1) {
      const beforeRequiredChanges = reviewCommentsForParsing.substring(0, separatorIndex).trim()
      const afterSeparator = reviewCommentsForParsing.substring(separatorIndex + '\n\nRequired Changes:'.length).trim()
      const afterRequiredChanges = afterSeparator.replace(/^\n+/, '').trim()
      generalComments = (beforeRequiredChanges?.length > 0) ? beforeRequiredChanges : null
      requiredChanges = (afterRequiredChanges?.length > 0) ? afterRequiredChanges : null
    } else if (reviewCommentsForParsing.trim().startsWith('Required Changes:')) {
      const extracted = reviewCommentsForParsing.replace(/^Required Changes:\s*\n?/, '').trim()
      requiredChanges = (extracted?.length > 0) ? extracted : null
    } else {
      generalComments = (reviewCommentsForParsing?.length > 0) ? reviewCommentsForParsing : null
    }
  } else {
    generalComments = reviewCommentsForParsing
  }

  if (!generalComments && !requiredChanges && finalReviewComments) generalComments = finalReviewComments

  return {
    status: applicationStatus,
    reviewComments: finalReviewComments,
    generalComments,
    requiredChanges,
    rejectionReason: finalRejectionReason,
    reviewedAt: statusData?.reviewedAt || record?.reviewedAt || null,
    businessName: record?.businessName || statusData?.businessName,
    applicationReferenceNumber: statusData?.applicationReferenceNumber || record?.referenceNumber
  }
}

/**
 * Parse from record only (fallback when API fails).
 */
export function parseReviewCommentsFromRecord(record) {
  const reviewComments = record?.reviewComments ?? null
  const rejectionReason = record?.rejectionReason ?? null
  const reviewCommentsValue = reviewComments != null ? (typeof reviewComments === 'string' ? reviewComments.trim() : String(reviewComments).trim()) : null
  const rejectionReasonValue = rejectionReason != null ? (typeof rejectionReason === 'string' ? rejectionReason.trim() : String(rejectionReason).trim()) : null
  const finalReviewComments = (reviewCommentsValue?.length > 0) ? reviewCommentsValue : null
  const finalRejectionReason = (rejectionReasonValue?.length > 0) ? rejectionReasonValue : null
  const reviewCommentsForParsing = finalReviewComments
  let generalComments = null
  let requiredChanges = null

  if (record?.status === 'needs_revision' && reviewCommentsForParsing) {
    const separatorIndex = reviewCommentsForParsing.indexOf('\n\nRequired Changes:')
    if (separatorIndex !== -1) {
      generalComments = (reviewCommentsForParsing.substring(0, separatorIndex).trim()?.length > 0) ? reviewCommentsForParsing.substring(0, separatorIndex).trim() : null
      requiredChanges = (reviewCommentsForParsing.substring(separatorIndex + '\n\nRequired Changes:'.length).replace(/^\n+/, '').trim()?.length > 0)
        ? reviewCommentsForParsing.substring(separatorIndex + '\n\nRequired Changes:'.length).replace(/^\n+/, '').trim() : null
    } else if (reviewCommentsForParsing.trim().startsWith('Required Changes:')) {
      requiredChanges = (reviewCommentsForParsing.replace(/^Required Changes:\s*\n?/, '').trim()?.length > 0) ? reviewCommentsForParsing.replace(/^Required Changes:\s*\n?/, '').trim() : null
    } else {
      generalComments = (reviewCommentsForParsing?.length > 0) ? reviewCommentsForParsing : null
    }
  } else {
    generalComments = reviewCommentsForParsing
  }

  return {
    status: record?.status,
    reviewComments: finalReviewComments,
    generalComments,
    requiredChanges,
    rejectionReason: finalRejectionReason,
    reviewedAt: record?.reviewedAt || null,
    businessName: record?.businessName,
    applicationReferenceNumber: record?.referenceNumber
  }
}
