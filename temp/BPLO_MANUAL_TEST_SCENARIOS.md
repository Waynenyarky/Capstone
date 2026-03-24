# BPLO Comprehensive Test Checklist

Complete manual testing guide for BPLO system. Test scenarios include error cases first, then success cases with specific field values.

---

## Table of Contents

- [Test Environment Setup](#test-environment-setup)
- [Public/Authentication Features](#publicauthentication-features)
- [Business Owner Features](#business-owner-features)
- [Staff - LGU Officer Features](#staff---lgu-officer-features)
- [Staff - Inspector Features](#staff---inspector-features)
- [LGU Manager Features](#lgu-manager-features)
- [Admin Features](#admin-features)
- [Common Features](#common-features)
- [Real-Life BPLO Office Flows](#real-life-bplo-office-flows)
- [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## Test Environment Setup

### Pre-requisites
- [ ] Backend services running (business-service, auth-service on ports 3001-3004)
- [ ] Frontend dev server running (port 5173 or fallback)
- [ ] Database seeded with test data
- [ ] Docker containers healthy (`docker-compose ps`)

### Test Accounts (Create if not exist)

| Role | Email | Password |
|------|-------|----------|
| Business Owner | `test.owner@example.com` | `TestPass123!` |
| LGU Officer | `officer@lgu.gov.ph` | `OfficerPass123!` |
| LGU Manager | `manager@lgu.gov.ph` | `ManagerPass123!` |
| Inspector | `inspector@lgu.gov.ph` | `InspectorPass123!` |
| Admin | `admin@example.com` | `AdminPass123!` |

### Browser Console Open
- Press F12 → Console tab
- Keep open during all tests to catch JavaScript errors

---

## Public/Authentication Features

### Landing & Public Pages

| Test | Page | Expected Result | Status |
|------|------|-----------------|--------|
| 1.1 | Home (`/`) | Loads without 404, all sections render | [ ] |
| 1.2 | Terms (`/terms`) | Content displays, back nav works | [ ] |
| 1.3 | Privacy (`/privacy`) | Content displays | [ ] |
| 1.4 | Maintenance (`/maintenance`) | Shows when system in maintenance mode | [ ] |

---

### User Registration

#### Error Scenarios (Test First)

| Test ID | Scenario | Steps | Expected Result | Status |
|---------|----------|-------|-----------------|--------|
| 2.1.1 | Empty Fields | Click "Create Account" with empty fields | Email & password errors shown | [ ] |
| 2.1.2 | Invalid Email | Email: `not-an-email` | Error: "Valid email required" | [ ] |
| 2.1.3 | Weak Password | Password: `123` | Error: "Password too weak" | [ ] |
| 2.1.4 | Password Mismatch | Password: `Pass123!`, Confirm: `Different123!` | Error: "Passwords don't match" | [ ] |
| 2.1.5 | Duplicate Email | Use existing: `test.owner@example.com` | Error: "Email already registered" | [ ] |

#### Success Scenario

| Test ID | Field | Value |
|---------|-------|-------|
| 2.2 | First Name | `John` |
| | Last Name | `Test` |
| | Email | `new.user.test123@example.com` |
| | Password | `TestPass123!` |
| | Confirm | `TestPass123!` |
| | Terms | Checked |

**Expected:** Account created, redirect to email verification [ ]

---

### Login

#### Error Scenarios (Test First)

| Test ID | Scenario | Input | Expected | Status |
|---------|----------|-------|----------|--------|
| 3.1.1 | Empty Fields | Both empty | Field errors shown | [ ] |
| 3.1.2 | Invalid Email | `invalid-email-format` | "Valid email required" | [ ] |
| 3.1.3 | Non-existent | `nonexistent12345@example.com` / `WrongPass123!` | "Invalid credentials" | [ ] |
| 3.1.4 | Wrong Password | `test.owner@example.com` / `WrongPass123!` | "Invalid credentials" | [ ] |
| 3.1.5 | CAPTCHA | Valid creds, no CAPTCHA | "Complete CAPTCHA" | [ ] |
| 3.1.6 | SQL Injection | `' OR '1'='1` / `' OR '1'='1` | Login fails, no DB error | [ ] |
| 3.1.7 | XSS Attempt | `<script>alert('xss')</script>` | Script not executed | [ ] |

#### Success Scenarios

| Role | Email | Password | Expected Redirect | Status |
|------|-------|----------|---------------------|--------|
| Business Owner | `test.owner@example.com` | `TestPass123!` | `/owner` | [ ] |
| LGU Officer | `officer@lgu.gov.ph` | `OfficerPass123!` | `/staff` | [ ] |
| LGU Manager | `manager@lgu.gov.ph` | `ManagerPass123!` | `/lgu-manager` | [ ] |
| Inspector | `inspector@lgu.gov.ph` | `InspectorPass123!` | `/staff` | [ ] |
| Admin | `admin@example.com` | `AdminPass123!` | `/admin/dashboard` | [ ] |

---

### Multi-Factor Authentication (MFA)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 4.1 | MFA Setup | QR code displays, TOTP works | [ ] |
| 4.2 | Invalid TOTP | Code `000000` → Error | [ ] |
| 4.3 | Valid TOTP | Correct code → Login complete | [ ] |

---

### Passkey/WebAuthn

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 5.1 | Passkey Registration | Passkey adds to security settings | [ ] |
| 5.2 | Passkey Login | Biometric prompt → Success | [ ] |
| 5.3 | Cross-Device | QR code → Mobile auth works | [ ] |

---

### Password Recovery

#### Error Scenarios

| Test ID | Scenario | Expected | Status |
|---------|----------|----------|--------|
| 6.1.1 | Non-existent Email | Generic message, no email sent | [ ] |
| 6.1.2 | Staff Account | Security alert, reset blocked | [ ] |

#### Success Scenario

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 6.2.1 | Enter `test.owner@example.com` | Reset email sent | [ ] |
| 6.2.2 | Click email link | Page opens, not expired | [ ] |
| 6.2.3 | Enter new password `NewPass123!` | Success message | [ ] |
| 6.2.4 | Login with new password | Success | [ ] |

---

## Business Owner Features

### Dashboard (`/owner`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 7.1 | Dashboard Loads | No errors, business list shows | [ ] |
| 7.2 | Business Selection | Details panel updates | [ ] |
| 7.3 | Pending Status | Shows "Under Review" | [ ] |
| 7.4 | Approved Status | Shows active status | [ ] |
| 7.5 | Renewal Alerts | Permit renewal notifications visible | [ ] |
| 7.6 | Profile Button | Links to `/settings-profile` | [ ] |

---

### New Application (`/application/new`)

#### Pre-Submission Validation (Error Scenarios First)

| Test ID | Field | Invalid Value | Error Expected | Status |
|---------|-------|---------------|----------------|--------|
| 8.1.1 | Business Name | (empty) | "Enter business name" | [ ] |
| 8.1.2 | Owner Email | `invalid-email` | "Valid email required" | [ ] |
| 8.1.3 | Owner Phone | `123` (3 digits) | "Invalid phone number" | [ ] |
| 8.1.4 | Documents | Unchecked | "Confirm required documents" | [ ] |
| 8.1.5 | Business Name | `AB` (2 chars) | "Min 3 characters" | [ ] |
| 8.1.6 | Business Name | `Test @#$% Restaurant` | "Invalid characters" | [ ] |
| 8.1.7 | Address | 600+ chars | "Max 500 characters" | [ ] |

#### Success Scenario

| Field | Valid Value |
|-------|-------------|
| Business Name | `E2E Test Restaurant` |
| Type | `Restaurant` |
| Line of Business | `Food Service` |
| Address | `123 Rizal Street, Poblacion, City of Alaminos, Pangasinan, 2404` |
| Owner Name | `John Test Doe` |
| Owner Email | `john.doe.test@example.com` |
| Owner Phone | `09123456789` |
| DTI/SEC | Checked |
| Barangay Clearance | Checked |

**Expected:** Success message, redirect to `/owner`, business appears in list [ ]

#### Draft Saving

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 8.3 | Save Draft | Draft persists on return | [ ] |

---

### Multi-Agency Clearance (`/clearance`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 9.1 | Page Loads | No 404 | [ ] |
| 9.2 | Reference Number | Format: CLR-YYYY-XXXXXX | [ ] |
| 9.3 | Status Display | Shows In Progress/All Approved/Has Rejection | [ ] |
| 9.4 | Progress Bar | Visible and accurate | [ ] |
| 9.5 | Agencies Listed | All 7 agencies shown | [ ] |
| 9.6 | Current Highlight | Current agency highlighted | [ ] |
| 9.7 | Queue Position | Shows if applicable | [ ] |
| 9.8 | Deficiency View | Shows description | [ ] |
| 9.9 | Deficiency Resolve | Upload docs → Status pending | [ ] |

---

### Payments (`/owner/payments`)

#### Prerequisites Check

| Test ID | Scenario | Expected | Status |
|---------|----------|----------|--------|
| 10.1 | No Clearances | Warning, payment disabled | [ ] |

#### Payment Gateway

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 10.2 | 4 Methods | GCash, Maya, Card, Bank Transfer shown | [ ] |
| 10.3 | GCash Flow | Checkout URL generated | [ ] |
| 10.4 | Bank Transfer | Recorded as "Pending Verification" | [ ] |
| 10.5 | Payment History | List with statuses | [ ] |
| 10.6 | Receipt Numbers | Visible for completed | [ ] |

---

### Inspection Scheduling (`/inspections/schedule`)

#### Prerequisites Check

| Test ID | Scenario | Expected | Status |
|---------|----------|----------|--------|
| 11.1 | Incomplete Clearances | Alert, calendar disabled | [ ] |

#### Success Scenarios

| Test ID | Feature | Steps / Value | Expected | Status |
|---------|---------|---------------|----------|--------|
| 11.2 | View Slots | Navigate to page | Available dates highlighted | [ ] |
| 11.3 | Book Slot | Date: available, Time: `9:00 AM - 10:00 AM`, Type: `INITIAL` | Ref: INS-YYYY-XXXXXX | [ ] |
| 11.4 | Cancel (>24h) | Click cancel | Success, slot available | [ ] |
| 11.5 | Cancel (<24h) | Try cancel | Error: "<24h" | [ ] |
| 11.6 | Reschedule | New date, reason: "Conflict" | Old cancelled, new booked | [ ] |

---

### Violation Tracker

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 12.1 | Summary Cards | Pending, Overdue, Complied, Total | [ ] |
| 12.2 | Violation List | Type, Severity, Deadline, Status | [ ] |
| 12.3 | Submit Compliance | Actions + docs → Under Review | [ ] |
| 12.4 | Appeal | Reason + docs → Under Appeal | [ ] |

---

## Staff - LGU Officer Features

### Application Review (`/staff/applications`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 13.1 | List Loads | Applications display | [ ] |
| 13.2 | Filter/Search | Works correctly | [ ] |
| 13.3 | Bookmark | Function works | [ ] |
| 13.4 | Review Details | Business, owner, docs visible | [ ] |
| 13.5 | Approve | Status: Approved, clearance auto-initiates | [ ] |
| 13.6 | Reject | Status: Rejected, reason recorded | [ ] |
| 13.7 | Request Revision | Status: Needs Revision | [ ] |

---

### Agency Dashboard (`/staff/agency/:agency`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 14.1 | Dashboard Loads | Stats: Pending, Under Review, Approved, Rejected | [ ] |
| 14.2 | Start Review | Status → Under Review | [ ] |
| 14.3 | Raise Deficiency | Description + required docs | [ ] |
| 14.4 | Approve | Certificate number recorded, next agency auto | [ ] |

---

## Staff - Inspector Features

### Inspections (`/staff/inspections`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 15.1 | Dashboard | Assigned inspections summary | [ ] |
| 15.2 | Complete | Findings + status + photos → Complete | [ ] |
| 15.3 | Add Violation | Type, severity, desc, deadline → Created | [ ] |
| 15.4 | Inspection History | List of past inspections | [ ] |

----

## LGU Manager Features

### Dashboard (`/lgu-manager`)

| Metric | Expected | Status |
|--------|----------|--------|
| Permits | Total, pending, approved, rejected, overdue | [ ] |
| Violations | Total, pending, resolved, overdue | [ ] |
| Inspections | Scheduled, completed, missed, compliance rate | [ ] |
| Appeals | Total, pending, under review, approved, rejected | [ ] |
| Cessations | Total, active, resolved, pending | [ ] |
| Department | Total officers, active, workload | [ ] |
| Trend Analysis | Period comparisons | [ ] |

### Assign Inspection (`/lgu-manager/assign-inspection`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 18.1 | Unassigned List | Displays | [ ] |
| 18.2 | Inspector List | With workload | [ ] |
| 18.3 | Assign | Confirmation, inspector notified | [ ] |

---

## Admin Features

### Dashboard (`/admin/dashboard`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 19.1 | KPIs | Pending requests, tamper incidents, form groups | [ ] |
| 19.2 | Maintenance Status | Indicator works | [ ] |
| 19.3 | Activity Log | Recent actions visible | [ ] |
| 19.4 | Tamper Summary | Security incidents | [ ] |

### User Management (`/admin/users`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 19.5 | Create Admin | Account created, email sent | [ ] |
| 19.6 | Create Staff | Role assignment works | [ ] |
| 19.7 | Disable Account | Cannot login, error shown | [ ] |

### Form Definitions (`/admin/form-definitions`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 20.1 | Builder Loads | Interface functional | [ ] |
| 20.2 | Add/Edit/Remove Fields | All operations work | [ ] |
| 20.3 | Reorder Fields | Works | [ ] |
| 20.4 | Validation Rules | Apply and save | [ ] |
| 20.5 | Form Preview | Renders correctly | [ ] |

### Fee Configuration (`/admin/fee-configuration`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 20.6 | Page Loads | Configuration visible | [ ] |
| 20.7 | Set Fees | By line of business | [ ] |
| 20.8 | Special Fees | Configuration works | [ ] |
| 20.9 | Penalties | Configuration works | [ ] |
| 20.10 | Save | Changes persist | [ ] |

---

## Common Features

### Profile Settings (`/settings-profile`)

| Tab | Feature | Expected | Status |
|-----|---------|----------|--------|
| General | Edit Info | Changes save | [ ] |
| Security | Change Password | Validation works | [ ] |
| Security | MFA Settings | Enable/disable | [ ] |
| Security | Passkey Management | Add/remove | [ ] |
| Theme | Light/Dark | Persists | [ ] |

### Notifications (`/notifications`)

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 22.1 | History | Displays | [ ] |
| 22.2 | Mark Read | Works | [ ] |
| 22.3 | Real-time | Badge updates | [ ] |

---

## Real-Life BPLO Office Flows

### Flow 1: New Business Permit Application (Complete Process)
**Scenario: First-time business owner applying for mayor's permit**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner registers account | Business Owner | Account created, email verification sent | [ ] |
| 2 | Complete business profile | Business Owner | Business details saved, compliance checklist shown | [ ] |
| 3 | Submit mayor's permit application | Business Owner | Application submitted, reference number generated | [ ] |
| 4 | LGU Officer reviews application | LGU Officer | Can approve, request corrections, or reject | [ ] |
| 5 | Pay application fee | Business Owner | Payment processed, receipt generated | [ ] |
| 6 | LGU Manager assigns inspections | LGU Manager | Inspector assigned, notified | [ ] |
| 7 | Inspector conducts inspection | Inspector | Inspection report filed, findings documented | [ ] |
| 8 | Final approval & permit issuance | LGU Officer | Mayor's permit issued, downloadable PDF | [ ] |

### Flow 2: Business Permit Renewal
**Scenario: Existing business renewing annual permit**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner requests renewal | Business Owner | Previous permit loaded, renewal form shown | [ ] |
| 2 | Update business information | Business Owner | Changes saved, compliance check updated | [ ] |
| 3 | Submit renewal application | Business Owner | Renewal processed, previous violations checked | [ ] |
| 4 | Pay renewal fee | Business Owner | Payment processed, new permit period set | [ ] |
| 5 | Express lane approval (if no violations) | LGU Officer | Quick approval, permit issued | [ ] |
| 6 | Inspection required (if violations) | Inspector | Follow-up inspection scheduled | [ ] |

### Flow 3: Violation Management
**Scenario: Inspector identifies business violation**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Inspector conducts routine inspection | Inspector | Business location inspected | [ ] |
| 2 | Violation identified and documented | Inspector | Violation record created, photo evidence attached | [ ] |
| 3 | Notice issued to business owner | Inspector | Business owner notified via email/app | [ ] |
| 4 | Business owner responds to violation | Business Owner | Can appeal, pay fine, or schedule correction | [ ] |
| 5 | LGU Officer reviews response | LGU Officer | Can approve correction plan or escalate | [ ] |
| 6 | Re-inspection conducted | Inspector | Compliance verified, violation closed | [ ] |

### Flow 4: Payment and Treasury Operations
**Scenario: Processing various payment types**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner initiates payment | Business Owner | Payment options shown (GCash, Maya, Bank Transfer) | [ ] |
| 2 | Select payment method | Business Owner | Payment gateway integration works | [ ] |
| 3 | Complete payment | Business Owner | Payment confirmed, reference number issued | [ ] |
| 4 | LGU Manager verifies payment | LGU Manager | Payment marked as verified, OR generated | [ ] |
| 5 | Generate official receipt | LGU Manager | PDF receipt created, sent to business owner | [ ] |
| 6 | Daily treasury reconciliation | LGU Manager | Daily report shows all collections | [ ] |

### Flow 5: Multi-Agency Clearance Processing
**Scenario: Business requiring multiple agency clearances**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Submit comprehensive application | Business Owner | All required agencies identified | [ ] |
| 2 | Barangay clearance processed | LGU Officer | Barangay clearance approved | [ ] |
| 3 | Zoning clearance review | LGU Officer | Zoning compliance verified | [ ] |
| 4 | Sanitary inspection | Inspector | Health clearance issued | [ ] |
| 5 | Fire safety inspection | Inspector | Fire safety clearance issued | [ ] |
| 6 | BFP clearance finalization | LGU Officer | BFP clearance approved | [ ] |
| 7 | Treasury assessment | LGU Manager | Fees calculated, payment processed | [ ] |
| 8 | Mayor's permit issuance | LGU Officer | Final permit issued with all clearances | [ ] |

### Flow 6: Staff Onboarding and Training
**Scenario: New staff member joining BPLO**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Admin creates staff account | Admin | Staff account created, credentials sent | [ ] |
| 2 | Staff completes onboarding | Staff | Password changed, MFA setup completed | [ ] |
| 3 | Role-specific training | Staff | Access to relevant modules granted | [ ] |
| 4 | First supervised transaction | LGU Manager | Staff guided through process | [ ] |
| 5 | Independent processing | Staff | Can handle transactions without supervision | [ ] |

### Flow 7: Business Closure and Cessation
**Scenario: Business permanently closing operations**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner initiates closure | Business Owner | Closure application submitted, reason documented | [ ] |
| 2 | LGU Officer reviews closure request | LGU Officer | Verifies outstanding violations, fees | [ ] |
| 3 | Inspector conducts final inspection | Inspector | Final compliance check, photos taken | [ ] |
| 4 | Clear all outstanding violations | LGU Officer | All violations marked as resolved | [ ] |
| 5 | Process final payments | Business Owner | All fees paid, receipts issued | [ ] |
| 6 | Issue closure certificate | LGU Manager | Official closure document generated | [ ] |
| 7 | Update business status | Admin | Business marked as inactive in system | [ ] |

### Flow 8: Change of Business Details
**Scenario: Business updating information or ownership**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner requests changes | Business Owner | Change application submitted with supporting docs | [ ] |
| 2 | LGU Officer reviews change request | LGU Officer | Validates supporting documents, checks compliance | [ ] |
| 3 | Additional inspection required | Inspector | Site inspection for new business activity | [ ] |
| 4 | Update business registration | LGU Officer | Business details updated in system | [ ] |
| 5 | Issue updated permit | LGU Manager | New permit with updated details issued | [ ] |
| 6 | Notify relevant agencies | Admin | Other agencies informed of changes | [ ] |

### Flow 9: Appeals and Dispute Resolution
**Scenario: Business owner contesting violation or decision**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Business owner files appeal | Business Owner | Appeal submitted with grounds and evidence | [ ] |
| 2 | LGU Officer reviews appeal | LGU Officer | Initial assessment of appeal validity | [ ] |
| 3 | Schedule appeal hearing | LGU Manager | Hearing date set, all parties notified | [ ] |
| 4 | Conduct appeal hearing | LGU Manager | Both parties present arguments | [ ] |
| 5 | Issue appeal decision | LGU Manager | Decision documented, reasons provided | [ ] |
| 6 | Implement decision outcome | LGU Officer | Violation upheld/reversed, actions taken | [ ] |

### Flow 10: Public Inquiry and Counter Services
**Scenario: Citizen requesting information or assistance at BPLO counter**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Citizen visits BPLO counter | Public | greeted, inquiry logged in system | [ ] |
| 2 | Staff provides information | LGU Officer | Accurate information given, brochure provided | [ ] |
| 3 | Check business permit status | LGU Officer | Real-time status lookup, verification provided | [ ] |
| 4 | Assist with application process | LGU Officer | Guidance provided, forms explained | [ ] |
| 5 | Record inquiry details | LGU Officer | Interaction logged for future reference | [ ] |
| 6 | Follow-up if needed | LGU Officer | Callback scheduled, case number provided | [ ] |

### Flow 11: Temporary and Special Permits
**Scenario: Short-term or event-based permits**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | Apply for temporary permit | Business Owner | Purpose, duration, location specified | [ ] |
| 2 | Review temporary permit request | LGU Officer | Check zoning, safety requirements | [ ] |
| 3 | Site inspection for temporary setup | Inspector | Location safety, compliance check | [ ] |
| 4 | Approve temporary permit | LGU Manager | Permit with specific conditions issued | [ ] |
| 5 | Monitor temporary operations | Inspector | Periodic checks during permit period | [ ] |
| 6 | Permit expiration and cleanup | Business Owner | Site restored, permit closed | [ ] |

### Flow 12: Emergency and Exception Handling
**Scenario: System issues and emergency procedures**

| Step | Action | User Role | Expected Outcome | Status |
|------|--------|----------|----------------|--------|
| 1 | System maintenance scheduled | Admin | Users notified, maintenance mode activated | [ ] |
| 2 | Emergency processing during downtime | LGU Officer | Manual processing procedures available | [ ] |
| 3 | Data backup and recovery | Admin | System restored, data integrity verified | [ ] |
| 4 | Communication with stakeholders | All Roles | Status updates sent via multiple channels | [ ] |

---

## Cross-Cutting Concerns

### Mobile Responsiveness

| Device | Resolution | Tests | Status |
|--------|------------|-------|--------|
| iPhone 12 Pro | 390x844 | /owner, /application/new, /payments, /clearance, /inspections/schedule | [ ] |
| Tablet | 768x1024 | Layout adapts | [ ] |

### Error Handling

| Test ID | Scenario | Expected | Status |
|---------|----------|----------|--------|
| 24.1 | 404 Page | Helpful message, back link | [ ] |
| 24.2 | Network Error | Message, retry option, data preserved | [ ] |
| 24.3 | Session Timeout | Redirect to login, return after | [ ] |

### Loading States

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 25.1 | Data Fetch | Loading indicators | [ ] |
| 25.2 | Skeleton | Where implemented | [ ] |
| 25.3 | Button Loading | During actions | [ ] |

---

## Security Testing

### Authentication Security

| Test ID | Scenario | Expected | Status |
|---------|----------|----------|--------|
| 26.1 | Protected Routes (logged out) | Redirect to /login | [ ] |
| 26.2 | Wrong Role Access | Unauthorized error | [ ] |
| 26.3 | SQL Injection | Sanitized, no DB error | [ ] |
| 26.4 | XSS Prevention | Script escaped | [ ] |

---

## Blockchain & AI Testing

| Test ID | Feature | Expected | Status |
|---------|---------|----------|--------|
| 27.1 | IPFS Upload | CID generated | [ ] |
| 27.2 | Audit Trail | Transaction hash recorded | [ ] |
| 28.1 | LOB Classification | AI suggests with confidence | [ ] |
| 28.2 | Document OCR | Text extracted | [ ] |

---

## Test Results Summary

### Test Run Information
- **Date:** _______________
- **Tester:** _______________
- **Browser:** _______________
- **OS:** _______________
- **Resolution:** _______________

### Results Count

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Authentication | 25 | | | |
| Business Owner | 40 | | | |
| LGU Officer | 20 | | | |
| Inspector | 10 | | | |
| LGU Manager | 12 | | | |
| Admin | 15 | | | |
| Security | 10 | | | |
| Blockchain/AI | 4 | | | |
| **TOTAL** | **144** | | | |

### Critical Issues
| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| | | Critical | |

### Sign-off
| Role | Name | Date |
|------|------|------|
| Tester | | |
| Reviewer | | |

---

*Document Version: 2.0*
*Updated: March 8, 2026*
