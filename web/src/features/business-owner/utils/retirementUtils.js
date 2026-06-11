import { formatDate } from './formatters.js'

export function buildRetirementRequestedDescription(retirementRequestedAt, retirementReason) {
  const reasonText = String(retirementReason || '').trim()
  return `Submitted ${formatDate(retirementRequestedAt)}. Waiting for inspector verification.${reasonText ? ` Reason: ${reasonText}` : ''}`
}
