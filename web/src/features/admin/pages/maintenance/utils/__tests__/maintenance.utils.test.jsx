import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  requestedByDisplay,
  userName,
  userEmail,
  entityId,
  isApprovedUpcoming,
  isDefaultVisible,
  getDisplayStatus,
  getDisplayTagColor,
  getRequestExpiryText,
  escapeCsv,
  filterApprovalsBySearch,
  filterApprovalsByStatus,
  filterApprovalsByReason,
  getRangeFilteredApprovals,
  generateCsvExport,
} from '../maintenance.utils.js'

describe('maintenance.utils', () => {
  describe('requestedByDisplay', () => {
    it('returns dash for null user', () => {
      expect(requestedByDisplay(null)).toBe('—')
    })

    it('returns full name when available', () => {
      const user = { firstName: 'John', lastName: 'Doe' }
      expect(requestedByDisplay(user)).toBe('John Doe')
    })

    it('returns email when name not available', () => {
      const user = { email: 'john@example.com' }
      expect(requestedByDisplay(user)).toBe('john@example.com')
    })

    it('returns dash when no name or email', () => {
      const user = {}
      expect(requestedByDisplay(user)).toBe('—')
    })
  })

  describe('userName', () => {
    it('returns dash for null user', () => {
      expect(userName(null)).toBe('—')
    })

    it('returns full name when available', () => {
      const user = { firstName: 'John', lastName: 'Doe' }
      expect(userName(user)).toBe('John Doe')
    })

    it('returns email when name not available', () => {
      const user = { email: 'john@example.com' }
      expect(userName(user)).toBe('john@example.com')
    })

    it('returns _id when no name or email', () => {
      const user = { _id: '123' }
      expect(userName(user)).toBe('123')
    })
  })

  describe('userEmail', () => {
    it('returns empty string for null user', () => {
      expect(userEmail(null)).toBe('')
    })

    it('returns email when available', () => {
      const user = { email: 'john@example.com' }
      expect(userEmail(user)).toBe('john@example.com')
    })

    it('returns empty string when no email', () => {
      const user = { name: 'John' }
      expect(userEmail(user)).toBe('')
    })
  })

  describe('entityId', () => {
    it('returns empty string for null entity', () => {
      expect(entityId(null)).toBe('')
    })

    it('returns string when entity is string', () => {
      expect(entityId('123')).toBe('123')
    })

    it('returns _id when entity is object', () => {
      const entity = { _id: '123' }
      expect(entityId(entity)).toBe('123')
    })

    it('returns id when _id not available', () => {
      const entity = { id: '456' }
      expect(entityId(entity)).toBe('456')
    })
  })

  describe('isApprovedUpcoming', () => {
    it('returns false for null approval', () => {
      expect(isApprovedUpcoming(null)).toBe(false)
    })

    it('returns false when status is not approved', () => {
      const approval = { status: 'pending', requestDetails: { scheduledStartAt: dayjs().add(1, 'day').toISOString() } }
      expect(isApprovedUpcoming(approval)).toBe(false)
    })

    it('returns false when no scheduled start', () => {
      const approval = { status: 'approved', requestDetails: {} }
      expect(isApprovedUpcoming(approval)).toBe(false)
    })

    it('returns true for approved upcoming maintenance', () => {
      const approval = {
        status: 'approved',
        requestDetails: { scheduledStartAt: dayjs().add(1, 'day').toISOString() }
      }
      expect(isApprovedUpcoming(approval)).toBe(true)
    })

    it('returns false for approved past maintenance', () => {
      const approval = {
        status: 'approved',
        requestDetails: { scheduledStartAt: dayjs().subtract(1, 'day').toISOString() }
      }
      expect(isApprovedUpcoming(approval)).toBe(false)
    })
  })

  describe('isDefaultVisible', () => {
    it('returns false for null approval', () => {
      expect(isDefaultVisible(null)).toBe(false)
    })

    it('returns true for pending requests', () => {
      const approval = { status: 'pending' }
      expect(isDefaultVisible(approval)).toBe(true)
    })

    it('returns true for approved upcoming requests', () => {
      const approval = {
        status: 'approved',
        requestDetails: { scheduledStartAt: dayjs().add(1, 'day').toISOString() }
      }
      expect(isDefaultVisible(approval)).toBe(true)
    })

    it('returns true for active maintenance', () => {
      const approval = {
        status: 'approved',
        requestDetails: {
          action: 'enable',
          scheduledStartAt: dayjs().subtract(1, 'hour').toISOString(),
          expectedResumeAt: dayjs().add(1, 'hour').toISOString()
        }
      }
      expect(isDefaultVisible(approval)).toBe(true)
    })

    it('returns true for rejected requests less than 48 hours old', () => {
      const approval = {
        status: 'rejected',
        createdAt: dayjs().subtract(24, 'hour').toISOString()
      }
      expect(isDefaultVisible(approval)).toBe(true)
    })

    it('returns false for rejected requests older than 48 hours', () => {
      const approval = {
        status: 'rejected',
        createdAt: dayjs().subtract(72, 'hour').toISOString()
      }
      expect(isDefaultVisible(approval)).toBe(false)
    })
  })

  describe('getDisplayStatus', () => {
    it('returns dash for null approval', () => {
      expect(getDisplayStatus(null)).toBe('—')
    })

    it('returns Pending for pending status', () => {
      const approval = { status: 'pending' }
      expect(getDisplayStatus(approval)).toBe('Pending')
    })

    it('returns Approved for approved status', () => {
      const approval = { status: 'approved' }
      expect(getDisplayStatus(approval)).toBe('Approved')
    })

    it('returns Rejected for rejected status', () => {
      const approval = { status: 'rejected' }
      expect(getDisplayStatus(approval)).toBe('Rejected')
    })
  })

  describe('getDisplayTagColor', () => {
    it('returns default for null approval', () => {
      expect(getDisplayTagColor(null)).toBe('default')
    })

    it('returns correct color for pending', () => {
      const approval = { status: 'pending' }
      expect(getDisplayTagColor(approval)).toBe('processing')
    })

    it('returns correct color for approved', () => {
      const approval = { status: 'approved' }
      expect(getDisplayTagColor(approval)).toBe('success')
    })
  })

  describe('getRequestExpiryText', () => {
    it('returns null for null approval', () => {
      expect(getRequestExpiryText(null)).toBe(null)
    })

    it('returns expiry text for pending request', () => {
      const approval = {
        status: 'pending',
        createdAt: dayjs().toISOString()
      }
      const text = getRequestExpiryText(approval)
      expect(text).toContain('Request expires on')
    })

    it('returns expired text for expired request', () => {
      const approval = {
        status: 'expired',
        createdAt: dayjs().subtract(50, 'hour').toISOString()
      }
      const text = getRequestExpiryText(approval)
      expect(text).toContain('Request expired on')
    })

    it('returns null for approved request', () => {
      const approval = {
        status: 'approved',
        createdAt: dayjs().toISOString()
      }
      expect(getRequestExpiryText(approval)).toBe(null)
    })
  })

  describe('escapeCsv', () => {
    it('returns empty string for null', () => {
      expect(escapeCsv(null)).toBe('')
    })

    it('returns string as-is when no special characters', () => {
      expect(escapeCsv('test')).toBe('test')
    })

    it('escapes values with commas', () => {
      expect(escapeCsv('test,value')).toBe('"test,value"')
    })

    it('escapes values with quotes', () => {
      expect(escapeCsv('test"value')).toBe('"test""value"')
    })

    it('escapes values with newlines', () => {
      expect(escapeCsv('test\nvalue')).toBe('"test\nvalue"')
    })
  })

  describe('filterApprovalsBySearch', () => {
    const approvals = [
      {
        requestDetails: { reason: 'Scheduled maintenance', message: 'Test message' },
        requestedBy: { firstName: 'John', lastName: 'Doe' }
      },
      {
        requestDetails: { reason: 'Emergency', message: 'Urgent fix' },
        requestedBy: { firstName: 'Jane', lastName: 'Smith' }
      }
    ]

    it('returns all approvals when query is empty', () => {
      expect(filterApprovalsBySearch(approvals, '')).toHaveLength(2)
    })

    it('filters by reason', () => {
      const result = filterApprovalsBySearch(approvals, 'scheduled')
      expect(result).toHaveLength(1)
    })

    it('filters by message', () => {
      const result = filterApprovalsBySearch(approvals, 'urgent')
      expect(result).toHaveLength(1)
    })

    it('filters by requester name', () => {
      const result = filterApprovalsBySearch(approvals, 'john')
      expect(result).toHaveLength(1)
    })
  })

  describe('filterApprovalsByStatus', () => {
    const approvals = [
      { status: 'pending' },
      { status: 'approved' },
      { status: 'rejected' }
    ]

    it('returns all approvals when no filter', () => {
      expect(filterApprovalsByStatus(approvals, null)).toHaveLength(3)
    })

    it('filters by status', () => {
      const result = filterApprovalsByStatus(approvals, 'pending')
      expect(result).toHaveLength(1)
    })
  })

  describe('filterApprovalsByReason', () => {
    const approvals = [
      { requestDetails: { reason: 'Scheduled maintenance' } },
      { requestDetails: { reason: 'Emergency maintenance' } },
      { requestDetails: { reason: 'Custom reason' } }
    ]

    it('returns all approvals when no filter', () => {
      expect(filterApprovalsByReason(approvals, null)).toHaveLength(3)
    })

    it('filters by reason', () => {
      const result = filterApprovalsByReason(approvals, 'Scheduled maintenance')
      expect(result).toHaveLength(1)
    })

    it('filters by __others__ to exclude preset reasons', () => {
      const result = filterApprovalsByReason(approvals, '__others__')
      expect(result).toHaveLength(1)
    })
  })

  describe('getRangeFilteredApprovals', () => {
    const approvals = [
      { createdAt: dayjs().subtract(1, 'day').toISOString() },
      { createdAt: dayjs().toISOString() },
      { createdAt: dayjs().add(1, 'day').toISOString() }
    ]

    it('returns all approvals when no range', () => {
      expect(getRangeFilteredApprovals(approvals, null, null)).toHaveLength(3)
    })

    it('filters by date range', () => {
      const start = dayjs().subtract(12, 'hour')
      const end = dayjs().add(12, 'hour')
      const result = getRangeFilteredApprovals(approvals, start, end)
      expect(result).toHaveLength(2)
    })
  })

  describe('generateCsvExport', () => {
    const approvals = [
      {
        approvalId: '1',
        status: 'pending',
        requestDetails: {
          action: 'enable',
          reason: 'Scheduled maintenance',
          message: 'Test message'
        },
        requestedBy: { firstName: 'John', lastName: 'Doe' },
        createdAt: dayjs().toISOString()
      }
    ]

    it('returns empty string for empty approvals', () => {
      expect(generateCsvExport([])).toBe('')
    })

    it('generates CSV with headers', () => {
      const csv = generateCsvExport(approvals)
      expect(csv).toContain('ID,Status,Action,Reason,Message,Requested By')
    })

    it('generates CSV with data rows', () => {
      const csv = generateCsvExport(approvals)
      expect(csv).toContain('1')
      expect(csv).toContain('pending')
    })

    it('escapes special characters in CSV', () => {
      const approvalsWithSpecial = [
        {
          approvalId: '1',
          status: 'pending',
          requestDetails: {
            action: 'enable',
            reason: 'Test, with comma',
            message: 'Test "quote" value'
          },
          requestedBy: { firstName: 'John', lastName: 'Doe' },
          createdAt: dayjs().toISOString()
        }
      ]
      const csv = generateCsvExport(approvalsWithSpecial)
      expect(csv).toContain('"Test, with comma"')
      expect(csv).toContain('Test ""quote"" value')
    })
  })
})
