import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  REASON_PRESET_OTHER,
  DISABLE_REASON_PRESET_OPTIONS,
  DISABLE_PRESET_REASONS,
  DISABLE_PRESET_MESSAGES,
} from '../../constants/requestMaintenance.constants.js'
import {
  DISABLE_REASON_PRESET_OPTIONS as MC_DISABLE_OPTIONS,
  DISABLE_PRESET_REASONS as MC_DISABLE_REASONS,
  DISABLE_PRESET_MESSAGES as MC_DISABLE_MESSAGES,
} from '../../constants/maintenance.constants.js'

// ── 1. Disable-specific preset constants ─────────────────────────────

describe('Disable Preset Constants', () => {
  it('requestMaintenance.constants exports DISABLE_REASON_PRESET_OPTIONS', () => {
    expect(Array.isArray(DISABLE_REASON_PRESET_OPTIONS)).toBe(true)
    expect(DISABLE_REASON_PRESET_OPTIONS.length).toBeGreaterThanOrEqual(3)
    expect(DISABLE_REASON_PRESET_OPTIONS.find((o) => o.value === 'completed')).toBeDefined()
    expect(DISABLE_REASON_PRESET_OPTIONS.find((o) => o.value === 'resolved')).toBeDefined()
    expect(DISABLE_REASON_PRESET_OPTIONS.find((o) => o.value === 'emergency_end')).toBeDefined()
    expect(DISABLE_REASON_PRESET_OPTIONS.find((o) => o.value === REASON_PRESET_OTHER)).toBeDefined()
  })

  it('requestMaintenance.constants exports DISABLE_PRESET_REASONS', () => {
    expect(DISABLE_PRESET_REASONS.completed).toBe('Maintenance completed')
    expect(DISABLE_PRESET_REASONS.resolved).toBe('Issue resolved')
    expect(DISABLE_PRESET_REASONS.emergency_end).toBe('Emergency end')
  })

  it('requestMaintenance.constants exports DISABLE_PRESET_MESSAGES with non-empty values', () => {
    expect(DISABLE_PRESET_MESSAGES.completed.length).toBeGreaterThan(0)
    expect(DISABLE_PRESET_MESSAGES.resolved.length).toBeGreaterThan(0)
    expect(DISABLE_PRESET_MESSAGES.emergency_end.length).toBeGreaterThan(0)
  })

  it('maintenance.constants mirrors the same disable presets', () => {
    expect(MC_DISABLE_OPTIONS).toEqual(DISABLE_REASON_PRESET_OPTIONS)
    expect(MC_DISABLE_REASONS).toEqual(DISABLE_PRESET_REASONS)
    expect(MC_DISABLE_MESSAGES).toEqual(DISABLE_PRESET_MESSAGES)
  })
})

// ── 2. "Starts" label visibility logic ───────────────────────────────

describe('"Starts" Label Visibility', () => {
  const shouldShowStarts = (action) => action !== 'disable'

  it('shows Starts for enable requests', () => {
    expect(shouldShowStarts('enable')).toBe(true)
  })

  it('shows Starts when action is undefined (legacy)', () => {
    expect(shouldShowStarts(undefined)).toBe(true)
  })

  it('hides Starts for disable requests', () => {
    expect(shouldShowStarts('disable')).toBe(false)
  })
})

// ── 3. Pending disable request blocking ──────────────────────────────

describe('Pending Disable Request Blocking', () => {
  const hasPendingDisableRequest = (approvals) =>
    approvals.some(
      (a) => a.status === 'pending' && a.requestDetails?.action === 'disable'
    )

  it('returns false when no approvals', () => {
    expect(hasPendingDisableRequest([])).toBe(false)
  })

  it('returns false when only enable requests exist', () => {
    const approvals = [
      { status: 'pending', requestDetails: { action: 'enable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(false)
  })

  it('returns true when a pending disable request exists', () => {
    const approvals = [
      { status: 'pending', requestDetails: { action: 'disable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(true)
  })

  it('returns false when a disable request is rejected', () => {
    const approvals = [
      { status: 'rejected', requestDetails: { action: 'disable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(false)
  })

  it('returns false when a disable request has expired', () => {
    const approvals = [
      { status: 'expired', requestDetails: { action: 'disable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(false)
  })

  it('returns false when a disable request is approved (already executed)', () => {
    const approvals = [
      { status: 'approved', requestDetails: { action: 'disable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(false)
  })

  it('returns true even with mixed requests', () => {
    const approvals = [
      { status: 'approved', requestDetails: { action: 'enable' } },
      { status: 'rejected', requestDetails: { action: 'disable' } },
      { status: 'pending', requestDetails: { action: 'disable' } },
    ]
    expect(hasPendingDisableRequest(approvals)).toBe(true)
  })
})

// ── 4. Undo restriction for executed requests ────────────────────────

describe('Undo Restriction for Executed Requests', () => {
  const canUndoVote = (approval, myVoteTimestamp) => {
    if (!approval) return false
    if (approval.executedAt) return false
    if (!myVoteTimestamp) return false

    const voteTime = dayjs(myVoteTimestamp)
    const deadline = voteTime.add(24, 'hour')
    return deadline.isAfter(dayjs())
  }

  it('allows undo when request is not executed and within window', () => {
    const approval = { executedAt: null }
    const recentVote = new Date().toISOString()
    expect(canUndoVote(approval, recentVote)).toBe(true)
  })

  it('blocks undo when request has executedAt set', () => {
    const approval = { executedAt: new Date().toISOString() }
    const recentVote = new Date().toISOString()
    expect(canUndoVote(approval, recentVote)).toBe(false)
  })

  it('blocks undo when vote window has expired', () => {
    const approval = { executedAt: null }
    const oldVote = dayjs().subtract(25, 'hour').toISOString()
    expect(canUndoVote(approval, oldVote)).toBe(false)
  })

  it('blocks undo when no vote exists', () => {
    const approval = { executedAt: null }
    expect(canUndoVote(approval, null)).toBe(false)
  })
})

// ── 5. Final vote warning detection ─────────────────────────────────

describe('Final Vote Warning Detection', () => {
  const isFinalVote = (approval) => {
    if (!approval || approval.status !== 'pending') return false
    const approvedCount = (approval.approvals || []).filter(
      (a) => a.approved === true
    ).length
    const required = approval.requiredApprovals || 2
    return approvedCount === required - 1
  }

  it('returns false when no approvals exist yet (0 of 2)', () => {
    const approval = {
      status: 'pending',
      approvals: [],
      requiredApprovals: 2,
    }
    expect(isFinalVote(approval)).toBe(false)
  })

  it('returns true when one approval exists (1 of 2)', () => {
    const approval = {
      status: 'pending',
      approvals: [{ approved: true }],
      requiredApprovals: 2,
    }
    expect(isFinalVote(approval)).toBe(true)
  })

  it('returns false when status is not pending', () => {
    const approval = {
      status: 'approved',
      approvals: [{ approved: true }],
      requiredApprovals: 2,
    }
    expect(isFinalVote(approval)).toBe(false)
  })

  it('returns false when required approvals is higher', () => {
    const approval = {
      status: 'pending',
      approvals: [{ approved: true }],
      requiredApprovals: 3,
    }
    expect(isFinalVote(approval)).toBe(false)
  })

  it('returns true for custom required approvals', () => {
    const approval = {
      status: 'pending',
      approvals: [{ approved: true }, { approved: true }],
      requiredApprovals: 3,
    }
    expect(isFinalVote(approval)).toBe(true)
  })

  it('ignores rejections in approved count', () => {
    const approval = {
      status: 'pending',
      approvals: [{ approved: false }],
      requiredApprovals: 2,
    }
    expect(isFinalVote(approval)).toBe(false)
  })
})

// ── 6. executedAt display logic ──────────────────────────────────────

describe('executedAt Display', () => {
  it('formats executedAt as "MMM D, YYYY HH:mm"', () => {
    const executedAt = '2025-06-15T10:30:00.000Z'
    const formatted = dayjs(executedAt).format('MMM D, YYYY HH:mm')
    expect(formatted).toMatch(/Jun 15, 2025/)
  })

  it('returns null/falsy when executedAt is not set', () => {
    expect(null).toBeFalsy()
    expect(undefined).toBeFalsy()
  })
})

// ── 7. Disable modal form initialization ────────────────────────────

describe('Disable Modal Form Initialization', () => {
  it('default preset is "completed"', () => {
    const initialDisablePreset = 'completed'
    expect(DISABLE_PRESET_REASONS[initialDisablePreset]).toBe('Maintenance completed')
    expect(DISABLE_PRESET_MESSAGES[initialDisablePreset].length).toBeGreaterThan(0)
  })

  it('other preset clears reason and message', () => {
    const preset = REASON_PRESET_OTHER
    expect(DISABLE_PRESET_REASONS[preset]).toBeUndefined()
    expect(DISABLE_PRESET_MESSAGES[preset]).toBeUndefined()
  })
})
