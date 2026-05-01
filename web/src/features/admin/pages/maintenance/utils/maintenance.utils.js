import dayjs from 'dayjs'
import { STATUS_COLORS, PRESET_HISTORY_REASONS } from '../constants/maintenance.constants.js'

/**
 * Display user name from user object
 */
export function requestedByDisplay(u) {
  if (!u) return '—'
  if (typeof u === 'object') {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
    return name || u.email || '—'
  }
  return '—'
}

/**
 * Format user name from user object
 */
export function userName(user) {
  if (!user) return '—'
  if (typeof user === 'object') {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
    return name || user.email || user._id || '—'
  }
  return '—'
}

/**
 * Extract user email from user object
 */
export function userEmail(user) {
  if (!user || typeof user !== 'object') return ''
  return user.email || ''
}

/**
 * Extract entity ID from entity object or string
 */
export function entityId(entity) {
  if (!entity) return ''
  if (typeof entity === 'string') return entity
  if (typeof entity === 'object') return String(entity._id ?? entity.id ?? '')
  return String(entity)
}

/**
 * Check if approval is approved and scheduled for future
 */
export function isApprovedUpcoming(approval) {
  const scheduled = approval?.requestDetails?.scheduledStartAt
  if (!scheduled || approval?.status !== 'approved') return false
  const ts = dayjs(scheduled)
  const now = dayjs()
  // Check if scheduled time is in the future
  if (!ts.isValid() || !ts.isAfter(now)) return false
  // Also check that the maintenance hasn't started yet
  const expectedResumeAt = approval?.requestDetails?.expectedResumeAt
  if (expectedResumeAt) {
    const resumeTs = dayjs(expectedResumeAt)
    // If resume time is in the past, the maintenance is already active, not upcoming
    if (resumeTs.isValid() && resumeTs.isBefore(now)) return false
  }
  return true
}

/**
 * Check if approval should be visible by default in the list
 */
export function isDefaultVisible(approval) {
  if (!approval) return false
  // Show all pending requests
  if (approval.status === 'pending') return true
  // Show approved upcoming requests
  if (isApprovedUpcoming(approval)) return true
  // Show active maintenance (approved and currently ongoing)
  if (approval.status === 'approved' && approval.requestDetails?.action === 'enable') {
    const details = approval.requestDetails
    const startAt = details.scheduledStartAt ? dayjs(details.scheduledStartAt) : null
    const endAt = details.expectedResumeAt ? dayjs(details.expectedResumeAt) : null
    const now = dayjs()
    // Active if: start time has passed (or is null for start now) and end time is in the future
    const hasStarted = !startAt || startAt.isBefore(now)
    const hasEnded = endAt && endAt.isBefore(now)
    if (hasStarted && !hasEnded) return true
  }
  // Show rejected requests less than 48 hours old
  if (approval?.status === 'rejected' && approval?.createdAt) {
    const rejectedAt = dayjs(approval.createdAt)
    const hoursSinceRejection = dayjs().diff(rejectedAt, 'hour')
    return hoursSinceRejection < 48
  }
  return false
}

/**
 * Get display status string for approval
 */
export function getDisplayStatus(approval) {
  if (!approval) return '—'
  if (approval.status === 'pending') return 'Pending'
  if (approval.status === 'approved') return 'Approved'
  if (approval.status === 'rejected') return 'Rejected'
  if (approval.status === 'expired') return 'Expired'
  if (approval.status === 'cancelled') return 'Cancelled'
  return approval.status || '—'
}

/**
 * Get tag color for approval status
 */
export function getDisplayTagColor(approval) {
  if (!approval) return 'default'
  return STATUS_COLORS[approval.status] || 'default'
}

/**
 * Get expiry text for pending/expired requests
 */
export function getRequestExpiryText(approval, requestExpiryHours = 48) {
  const requestExpiryDate = approval?.createdAt
    ? dayjs(approval.createdAt).add(requestExpiryHours, 'hour')
    : null
  if (!requestExpiryDate?.isValid()) return null
  if (approval?.status === 'expired') {
    return `Request expired on ${requestExpiryDate.format('MMM D, YYYY HH:mm')}`
  }
  if (approval?.status === 'pending') {
    return `Request expires on ${requestExpiryDate.format('MMM D, YYYY HH:mm')}`
  }
  return null
}

/**
 * Escape CSV value
 */
export function escapeCsv(value) {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Filter approvals by search query
 */
export function filterApprovalsBySearch(approvals, query) {
  if (!query || query.trim() === '') return approvals
  const q = query.trim().toLowerCase()
  return approvals.filter((a) => {
    const requestedBy = requestedByDisplay(a.requestedBy).toLowerCase()
    const reason = (a.requestDetails?.reason || '').toLowerCase()
    const message = (a.requestDetails?.message || '').toLowerCase()
    const id = (a.approvalId || '').toLowerCase()
    return requestedBy.includes(q) || reason.includes(q) || message.includes(q) || id.includes(q)
  })
}

/**
 * Filter approvals by status
 */
export function filterApprovalsByStatus(approvals, statusFilter) {
  if (!statusFilter) return approvals
  if (statusFilter === 'approved_upcoming') {
    return approvals.filter((a) => isApprovedUpcoming(a) && a.status === 'approved')
  }
  return approvals.filter((a) => a.status === statusFilter)
}

/**
 * Filter approvals by reason
 */
export function filterApprovalsByReason(approvals, reasonFilter) {
  if (!reasonFilter) return approvals
  if (reasonFilter === '__others__') {
    return approvals.filter((a) => {
      const reason = a.requestDetails?.reason || ''
      return !!reason && !PRESET_HISTORY_REASONS.includes(reason)
    })
  }
  return approvals.filter((a) => (a.requestDetails?.reason || '') === reasonFilter)
}

/**
 * Filter approvals by date range
 */
export function getRangeFilteredApprovals(approvals, start, end) {
  if (!start || !end) return approvals
  const startDate = dayjs(start).startOf('day')
  const endDate = dayjs(end).endOf('day')
  if (!startDate.isValid() || !endDate.isValid()) return approvals
  return approvals.filter((approval) => {
    const createdAt = approval?.createdAt ? dayjs(approval.createdAt) : null
    if (!createdAt || !createdAt.isValid()) return false
    return createdAt.isAfter(startDate) && createdAt.isBefore(endDate)
  })
}

/**
 * Generate CSV export data for approvals
 */
export function generateCsvExport(approvals) {
  if (!approvals || approvals.length === 0) return ''
  
  const headers = ['ID', 'Status', 'Action', 'Reason', 'Message', 'Requested By', 'Created At', 'Scheduled Start', 'Expected Resume']
  const rows = approvals.map((approval) => {
    const details = approval.requestDetails || {}
    return [
      approval.approvalId || '',
      approval.status || '',
      details.action || '',
      details.reason || '',
      details.message || '',
      requestedByDisplay(approval.requestedBy),
      approval.createdAt ? dayjs(approval.createdAt).format('MMM D, YYYY HH:mm') : '',
      details.scheduledStartAt ? dayjs(details.scheduledStartAt).format('MMM D, YYYY HH:mm') : '',
      details.expectedResumeAt ? dayjs(details.expectedResumeAt).format('MMM D, YYYY HH:mm') : '',
    ].map(escapeCsv).join(',')
  })
  
  return [headers.join(','), ...rows].join('\n')
}
