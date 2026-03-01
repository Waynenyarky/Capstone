# Phase 6: Testing

## Overview
Ensure all existing tests pass, add tests for all new features built in Phases 0–5B and 4C-A, and add integration tests for critical workflows. Testing covers backend (Jest), web (Vitest), and E2E (Playwright if configured).

## Prerequisites
All feature and refactoring phases (0–5B, including 4C-A audit hardening) must be complete.

---

## 6-1. Verify All Existing Tests Pass

### Backend tests:
```bash
cd backend && npm test
```

Fix any test failures caused by:
- Model schema changes (new fields in Inspection, BusinessProfile, Notification)
- Route path changes (broken require paths fixed in Phase 0)
- New middleware (Helmet, CAPTCHA)

### Web tests:
```bash
cd web && npm test
```

Fix any failures from:
- Deleted components (Phase 0 cleanup)
- Changed imports
- New component props

---

## 6-2. Backend Unit Tests to Add

### Security tests:

**File:** `backend/__tests__/security/signup-security.test.js` (new)

```javascript
describe('Signup Security', () => {
  it('should reject weak passwords on direct /signup route', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
      termsAccepted: true,
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('weak_password')
  })

  it('should require CAPTCHA when enabled', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-key'
    const res = await request(app).post('/api/auth/signup/start').send({
      email: 'test@example.com',
      password: 'StrongPass123!',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('captcha_failed')
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it('should not allow email "1" in production mode', async () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const res = await request(app).post('/api/auth/login/start').send({
      email: '1',
      password: '1',
    })
    expect(res.status).toBe(400) // Should fail validation
    process.env.NODE_ENV = origEnv
  })
})
```

### Retirement route tests:

**File:** `backend/__tests__/business/retirement.test.js` (new)

```javascript
describe('Business Retirement', () => {
  it('should block retirement when open violations exist', async () => {
    // Create business with an inspection that has an open violation
    // Attempt to retire
    // Expect 400 with 'open_violations' code
  })

  it('should allow retirement when no open violations', async () => {
    // Create business with no violations
    // Attempt to retire
    // Expect 200 with retirementStatus 'requested'
  })

  it('should reject retirement for already-retiring business', async () => {
    // Business with retirementStatus 'requested'
    // Attempt to retire again
    // Expect 400
  })
})
```

### Notification tests:

**File:** `backend/__tests__/notifications/cross-service.test.js` (new)

```javascript
describe('Cross-Service Notification Push', () => {
  it('should accept internal push with valid key', async () => {
    const res = await request(app)
      .post('/api/notifications/internal-push')
      .set('x-internal-key', process.env.INTERNAL_SERVICE_KEY)
      .send({ userId: 'test-user-id', notification: { title: 'Test', message: 'Test' } })
    expect(res.status).toBe(200)
  })

  it('should reject internal push without key', async () => {
    const res = await request(app)
      .post('/api/notifications/internal-push')
      .send({ userId: 'test-user-id', notification: { title: 'Test', message: 'Test' } })
    expect(res.status).toBe(403)
  })
})
```

### Fee calculator tests:

**File:** `backend/__tests__/business/feeCalculator.test.js` (new)

```javascript
describe('Fee Calculator', () => {
  it('should look up fee config by taxCode', async () => {
    const config = await getFeeConfig('RET')
    expect(config).toBeTruthy()
    expect(config.taxCode).toBe('RET')
  })

  it('should fall back to label match', async () => {
    const config = await getFeeConfig('Retail')
    expect(config).toBeTruthy()
  })

  it('should include barangay clearance fee', async () => {
    const fees = await computeApplicationFees({
      businessActivities: [{ lineOfBusiness: 'RET' }],
      areaSqm: 50,
    })
    expect(fees).toHaveProperty('barangayClearanceFee')
  })
})
```

### Post-requirement tests:

**File:** `backend/__tests__/business/postRequirements.test.js` (new)

```javascript
describe('Post-Requirements', () => {
  it('should create a post-requirement', async () => { /* ... */ })
  it('should allow business owner to submit documents', async () => { /* ... */ })
  it('should allow staff to verify submission', async () => { /* ... */ })
  it('should mark overdue requirements', async () => { /* ... */ })
})
```

---

## 6-3. Web Component Tests to Add

### ApprovedBusinessView tests:

**File:** `web/src/features/business-owner/components/__tests__/ApprovedBusinessView.test.jsx` (new)

```javascript
describe('ApprovedBusinessView', () => {
  it('renders 4 tabs', () => {
    render(<ApprovedBusinessView business={mockBusiness} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('Permits')).toBeInTheDocument()
  })

  it('shows retirement button for active businesses', () => { /* ... */ })
  it('hides retirement button for already-retiring businesses', () => { /* ... */ })
  it('shows renewal button in January', () => { /* ... */ })
})
```

### StaffReportsPage tests:

**File:** `web/src/features/staffs/lgu-officer/pages/__tests__/StaffReportsPage.test.jsx` (new)

```javascript
describe('StaffReportsPage', () => {
  it('renders activity stats from API', () => { /* ... */ })
  it('handles empty activity data', () => { /* ... */ })
  it('supports period filter change', () => { /* ... */ })
})
```

### NotificationHistoryPage — new types:

**File:** `web/src/features/user/pages/__tests__/NotificationHistoryPage.test.jsx` (new or extend)

```javascript
describe('NotificationHistoryPage', () => {
  it('renders correct icons for new notification types', () => {
    // Test: payment_received, violation_issued, retirement_accepted, etc.
  })
})
```

---

## 6-4. Integration Tests

### Permit Application Flow (end-to-end):

**File:** `backend/__tests__/integration/permit-flow.test.js` (new)

```javascript
describe('Permit Application Flow', () => {
  it('full lifecycle: create → submit → review → approve', async () => {
    // 1. Business owner creates business
    // 2. Business owner submits application
    // 3. LGU officer starts review
    // 4. LGU officer approves
    // 5. Verify notification created for owner
    // 6. Verify application status is 'approved'
  })

  it('rejection and appeal flow', async () => {
    // 1. Create and submit
    // 2. Officer rejects
    // 3. Owner files appeal
    // 4. Verify appeal is persisted
  })
})
```

### Renewal Flow:

**File:** `backend/__tests__/integration/renewal-flow.test.js` (new)

```javascript
describe('Renewal Flow', () => {
  it('auto-flag → start → submit → approve', async () => {
    // 1. Run flagBusinessesForRenewal cron
    // 2. Owner starts renewal
    // 3. Owner submits documents
    // 4. Officer approves
    // 5. Verify renewal status
  })
})
```

### Inspection → Violation → Retirement Flow:

**File:** `backend/__tests__/integration/inspection-retirement.test.js` (new)

```javascript
describe('Inspection to Retirement', () => {
  it('blocks retirement with open violations', async () => {
    // 1. Create inspection with violation (status: open)
    // 2. Attempt retirement → should be blocked
    // 3. Resolve violation
    // 4. Attempt retirement → should succeed
  })
})
```

---

## 6-5. Cron Job Tests

**File:** `backend/__tests__/cron/renewalAutoFlag.test.js` (new)

```javascript
describe('Renewal Auto-Flag Cron', () => {
  it('creates draft renewals for active businesses without current-year renewal', async () => { /* ... */ })
  it('does not duplicate renewals if run twice', async () => { /* ... */ })
  it('calculates monthly interest correctly', async () => { /* ... */ })
})
```

**File:** `backend/__tests__/cron/abandonedDetection.test.js` (new)

```javascript
describe('Abandoned Detection Cron', () => {
  it('flags businesses without renewal after April', async () => { /* ... */ })
  it('skips businesses in January-March', async () => { /* ... */ })
  it('skips businesses already in retirement', async () => { /* ... */ })
})
```

---

## 6-6. Audit Logging & Blockchain Tests (Phase 4C-A)

### Audit coverage test — verify every state-changing route logs an audit entry:

**File:** `backend/__tests__/audit/audit-coverage.test.js` (new)

```javascript
describe('Audit Log Coverage', () => {
  // Auth events
  it('login produces an audit log with eventType "login"', async () => {
    await loginAs('admin@example.com')
    const log = await AuditLog.findOne({ eventType: 'login' }).sort({ createdAt: -1 })
    expect(log).toBeTruthy()
    expect(log.metadata).toHaveProperty('ip')
    expect(log.metadata).toHaveProperty('userAgent')
  })

  it('logout produces an audit log', async () => {
    const token = await loginAs('admin@example.com')
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`)
    const log = await AuditLog.findOne({ eventType: 'logout' }).sort({ createdAt: -1 })
    expect(log).toBeTruthy()
  })

  it('signup produces an audit log', async () => {
    await signupNewUser('newuser@example.com')
    const log = await AuditLog.findOne({ eventType: 'signup' }).sort({ createdAt: -1 })
    expect(log).toBeTruthy()
  })

  it('failed login produces an audit log with eventType "login_failed"', async () => {
    await request(app).post('/api/auth/login/start').send({ email: 'admin@example.com', password: 'wrong' })
    const log = await AuditLog.findOne({ eventType: 'login_failed' }).sort({ createdAt: -1 })
    expect(log).toBeTruthy()
    expect(log.metadata.reason).toBe('invalid_credentials')
  })

  // Business lifecycle events
  it('business retirement request produces audit log', async () => { /* ... */ })
  it('inspection creation produces audit log', async () => { /* ... */ })
  it('violation issuance produces audit log', async () => { /* ... */ })
  it('appeal submission produces audit log', async () => { /* ... */ })
  it('payment completion produces audit log', async () => { /* ... */ })

  // Admin events
  it('form definition creation produces audit log', async () => { /* ... */ })
  it('staff creation produces audit log', async () => { /* ... */ })
  it('fee config change produces audit log', async () => { /* ... */ })
})
```

### Blockchain anchoring test:

**File:** `backend/__tests__/audit/blockchain-anchoring.test.js` (new)

```javascript
describe('Blockchain Anchoring', () => {
  it('new audit log starts with blockchainStatus "pending"', async () => {
    const log = await createAuditLog(userId, 'login', 'session', '', 'active', 'admin', {})
    expect(log.blockchainStatus).toBe('pending')
  })

  it('blockchainStatus becomes "anchored" after queue processes', async () => {
    // Create audit log, wait for queue, check status
    const log = await createAuditLog(userId, 'login', 'session', '', 'active', 'admin', {})
    // Wait for blockchain queue (mock or real)
    await waitFor(() => AuditLog.findById(log._id).then(l => l.blockchainStatus === 'anchored'))
    const updated = await AuditLog.findById(log._id)
    expect(updated.blockchainStatus).toBe('anchored')
    expect(updated.txHash).toBeTruthy()
    expect(updated.blockNumber).toBeGreaterThan(0)
  })

  it('blockchainStatus becomes "failed" when blockchain is unreachable', async () => {
    // Mock blockchain service as unavailable after queueing
    // Verify status transitions to "failed" after retries
  })

  it('blockchainStatus becomes "skipped" when audit-service HTTP call fails', async () => {
    // Mock axios.post to reject
    // Verify the audit log still exists in MongoDB with blockchainStatus "skipped"
  })

  it('admin-service audit logs reach blockchain (not just auth and business)', async () => {
    // Create audit log via admin-service
    // Verify it has a txHash (proves the forwarding fix works)
  })
})
```

### Containment enforcement test:

**File:** `backend/__tests__/audit/containment.test.js` (new)

```javascript
describe('Containment Enforcement', () => {
  it('returns 423 for contained user on state-changing routes', async () => {
    // 1. Create a TamperIncident with containmentActive: true for a userId
    // 2. Make a state-changing request as that user
    // 3. Expect HTTP 423 with code ACCOUNT_CONTAINED
  })

  it('allows read-only routes for contained users', async () => {
    // 1. Same contained user
    // 2. Make a GET request
    // 3. Expect 200 (containment only blocks mutations)
  })

  it('allows requests after containment is lifted', async () => {
    // 1. Set containmentActive: false on the incident
    // 2. Make state-changing request
    // 3. Expect 200
  })

  it('containment activation is itself audit-logged', async () => {
    // After toggling containment, verify an audit log with eventType 'containment_activated'
  })
})
```

### Retry failed anchors cron test:

**File:** `backend/__tests__/cron/retryFailedAnchors.test.js` (new)

```javascript
describe('Retry Failed Anchors Cron', () => {
  it('re-queues failed audit logs for blockchain anchoring', async () => {
    // 1. Create audit log with blockchainStatus: 'failed'
    // 2. Run retryFailedAnchors()
    // 3. Verify it was re-queued (mock blockchainQueue.queueBlockchainOperation)
  })

  it('re-queues skipped audit logs', async () => {
    // Same but with blockchainStatus: 'skipped'
  })

  it('ignores logs older than 72 hours', async () => {
    // Create old failed log, run cron, verify NOT re-queued
  })

  it('limits batch to 50 logs per run', async () => {
    // Create 100 failed logs, run cron, verify only 50 processed
  })
})
```

### Forensic endpoint test:

**File:** `backend/__tests__/audit/forensic.test.js` (new)

```javascript
describe('Forensic Endpoint', () => {
  it('returns correct diagnosis for untampered record', async () => {
    const log = await createAuditLog(userId, 'login', 'session', '', 'active', 'admin', {})
    const res = await request(app).get(`/api/audit/forensic/${log._id}`)
      .set('X-API-Key', process.env.AUDIT_SERVICE_API_KEY)
    expect(res.status).toBe(200)
    expect(res.body.forensic.tampered).toBe(false)
    expect(res.body.forensic.hashMatch).toBe(true)
  })

  it('detects tampered record', async () => {
    const log = await createAuditLog(userId, 'login', 'session', '', 'active', 'admin', {})
    // Directly modify the MongoDB record (simulating tampering)
    await AuditLog.findByIdAndUpdate(log._id, { newValue: 'TAMPERED' })
    const res = await request(app).get(`/api/audit/forensic/${log._id}`)
      .set('X-API-Key', process.env.AUDIT_SERVICE_API_KEY)
    expect(res.body.forensic.tampered).toBe(true)
    expect(res.body.forensic.hashMatch).toBe(false)
    expect(res.body.forensic.diagnosis).toContain('modified')
  })

  it('identifies un-anchored record', async () => {
    // Audit log with no txHash
    const res = await request(app).get(`/api/audit/forensic/${logWithNoTxHash._id}`)
      .set('X-API-Key', process.env.AUDIT_SERVICE_API_KEY)
    expect(res.body.forensic.blockchainAnchored).toBe(false)
    expect(res.body.forensic.diagnosis).toContain('not been anchored')
  })
})
```

### Queue status endpoint test:

**File:** `backend/__tests__/audit/queue-status.test.js` (new)

```javascript
describe('Queue Status Endpoint', () => {
  it('returns queue metrics', async () => {
    const res = await request(app).get('/api/audit/queue-status')
      .set('X-API-Key', process.env.AUDIT_SERVICE_API_KEY)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('queue')
    expect(res.body).toHaveProperty('unanchored')
    expect(res.body.unanchored).toHaveProperty('pending')
    expect(res.body.unanchored).toHaveProperty('failed')
    expect(res.body.unanchored).toHaveProperty('skipped')
    expect(res.body).toHaveProperty('blockchainAvailable')
  })

  it('rejects request without API key', async () => {
    const res = await request(app).get('/api/audit/queue-status')
    expect(res.status).toBe(403)
  })
})
```

### Schema validation test:

**File:** `backend/__tests__/audit/schema-validation.test.js` (new)

```javascript
describe('AuditLog Schema Validation', () => {
  const ALL_EVENT_TYPES = [
    'login', 'login_failed', 'logout', 'signup',
    'mfa_verified', 'mfa_disabled', 'mfa_setup_started',
    'webauthn_registered', 'webauthn_removed',
    'staff_created', 'avatar_uploaded', 'avatar_deleted',
    'inspection_created', 'inspection_submitted', 'violation_issued',
    'appeal_submitted', 'appeal_resolved',
    'payment_created', 'payment_completed', 'payment_cancelled',
    'business_retirement_requested', 'business_retirement_confirmed',
    'business_renewal_submitted',
    'walk_in_registered',
    'form_definition_created', 'form_definition_updated',
    'containment_activated',
  ]

  ALL_EVENT_TYPES.forEach(eventType => {
    it(`accepts eventType "${eventType}" without validation error`, async () => {
      const log = await AuditLog.create({
        userId: new mongoose.Types.ObjectId(),
        eventType,
        role: 'admin',
        hash: 'test-hash',
      })
      expect(log._id).toBeTruthy()
      await AuditLog.deleteOne({ _id: log._id })
    })
  })
})
```

---

## 6-7. Test Coverage Targets

| Area | Current (est.) | Target |
|---|---|---|
| Auth-service routes | ~60% | 80% |
| Business-service routes | ~40% | 70% |
| Admin-service routes | ~30% | 60% |
| Audit-service routes | ~20% | 70% |
| Audit log coverage (all event types) | ~40% | 95% |
| Blockchain anchoring flow | 0% | 80% |
| Containment enforcement | 0% | 90% |
| Web components | ~30% | 50% |
| Cron jobs (renewal, abandoned, retryAnchors) | 0% | 80% |
| Fee calculator | ~20% | 90% |

---

## Edge Cases
- Tests for dev backdoors must verify they're disabled in production config
- Integration tests need a test database (verify `TEST_MONGODB_URI` is configured)
- Web tests need mock API responses (MSW or vitest mock)
- Cron tests should mock `Date.now()` to test time-dependent logic
- Blockchain tests should mock `blockchainService` and `blockchainQueue` — do NOT require a running Ganache instance in CI
- Containment tests need to mock the inter-service HTTP call to admin-service's `/contained-users` endpoint
- Forensic tests need a real AuditLog with a computed hash, then deliberately corrupt a field to simulate tampering
- Schema validation tests must cover ALL new eventType values from Phase 4C-A (the full list is in `spec-phase4c-audit-hardening.md` Parts 1-1 through 1-4)

## Acceptance Criteria
1. All existing tests pass: `cd backend && npm test` and `cd web && npm test`
2. New test files created for all features from Phases 0–5B and 4C-A
3. Integration tests cover 3 critical workflows (permit, renewal, inspection-to-retirement)
4. Cron job tests verify idempotency (renewal auto-flag, abandoned detection, retryFailedAnchors)
5. Fee calculator has 90%+ coverage
6. Audit log coverage: every new `eventType` value is tested for schema acceptance
7. Audit log coverage: login, logout, signup, MFA, WebAuthn, inspections, violations, appeals, payments, retirement, renewals all produce audit entries
8. Blockchain anchoring: `blockchainStatus` transitions (pending → anchored, pending → failed, pending → skipped) are all tested
9. Containment enforcement: HTTP 423 is returned for contained users; read-only routes remain accessible
10. Forensic endpoint: correctly identifies tampered vs untampered vs un-anchored records
11. Queue status endpoint: returns correct unanchored counts
12. No test uses hardcoded ports or external services
13. CI-compatible: all tests run without manual setup (blockchain tests mock the blockchain service)

## Rollback Plan
Tests are additive — removing them doesn't affect production code. Fix any test that fails due to incorrect assumptions.
