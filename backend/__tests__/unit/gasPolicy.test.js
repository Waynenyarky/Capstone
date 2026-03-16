/**
 * Unit tests for gasPolicy.js — event tier classification
 */

const { classify, TIER_A, TIER_B, TIER_C } = require('../../services/audit-service/src/lib/gasPolicy')

describe('gasPolicy.classify', () => {
  // Tier A: legally significant, always anchor
  describe('Tier A (must-anchor)', () => {
    const tierACases = [
      ['logAdminApproval', undefined],
      ['logCriticalEvent', undefined],
      ['logAuditHash', 'permit_issued'],
      ['logAuditHash', 'permit_revoked'],
      ['logAuditHash', 'business_approved'],
      ['logAuditHash', 'business_rejected'],
      ['logAuditHash', 'application_approved'],
      ['logAuditHash', 'application_rejected'],
      ['logAuditHash', 'role_change'],
      ['logAuditHash', 'admin_action'],
      ['logAuditHash', 'account_deletion'],
      ['logAuditHash', 'ownership_transfer'],
      ['logAuditHash', 'clearance_approved'],
      ['logAuditHash', 'clearance_rejected'],
      ['logAuditHash', 'inspection_completed'],
      ['logAuditHash', 'violation_issued'],
      ['logAuditHash', 'appeal_resolved'],
      ['logAuditHash', 'payment_confirmed'],
    ]

    test.each(tierACases)('%s + %s → Tier A', (operation, eventType) => {
      const result = classify(operation, eventType)
      expect(result.tier).toBe(TIER_A)
      expect(result.anchor).toBe(true)
      expect(result.batch).toBe(false)
      expect(result.skip).toBe(false)
    })
  })

  // Tier B: routine, batched
  describe('Tier B (digest-anchor)', () => {
    const tierBCases = [
      ['logAuditHash', 'profile_update'],
      ['logAuditHash', 'email_change'],
      ['logAuditHash', 'password_change'],
      ['logAuditHash', 'login'],
      ['logAuditHash', 'logout'],
      ['logAuditHash', 'session_created'],
      ['logAuditHash', 'mfa_enabled'],
      ['logAuditHash', 'mfa_disabled'],
      ['logAuditHash', 'document_uploaded'],
      ['logAuditHash', 'status_change'],
    ]

    test.each(tierBCases)('%s + %s → Tier B', (operation, eventType) => {
      const result = classify(operation, eventType)
      expect(result.tier).toBe(TIER_B)
      expect(result.anchor).toBe(false)
      expect(result.batch).toBe(true)
      expect(result.skip).toBe(false)
    })
  })

  // Tier C: off-chain only
  describe('Tier C (off-chain only)', () => {
    const tierCCases = [
      ['logAuditHash', 'page_view'],
      ['logAuditHash', 'search'],
      ['logAuditHash', 'notification_sent'],
      ['logAuditHash', 'notification_read'],
      ['logAuditHash', 'export'],
      ['logAuditHash', 'filter_applied'],
    ]

    test.each(tierCCases)('%s + %s → Tier C', (operation, eventType) => {
      const result = classify(operation, eventType)
      expect(result.tier).toBe(TIER_C)
      expect(result.anchor).toBe(false)
      expect(result.batch).toBe(false)
      expect(result.skip).toBe(true)
    })
  })

  // Unknown events default to Tier B
  describe('Unknown events', () => {
    test('unknown operation defaults to Tier B', () => {
      const result = classify('unknownOp', 'unknown_event')
      expect(result.tier).toBe(TIER_B)
      expect(result.batch).toBe(true)
    })

    test('logAuditHash with unknown eventType defaults to Tier B', () => {
      const result = classify('logAuditHash', 'some_new_event_type')
      expect(result.tier).toBe(TIER_B)
    })
  })
})
