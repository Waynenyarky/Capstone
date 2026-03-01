# Phase 0B: Comprehensive Dev Seeder

## Overview
Create a single seeder script that, when run in development mode, populates the entire database with realistic Alaminos City data — making BizClear look and feel like a live system that's been operating for 6 months. Every dashboard, table, notification badge, and analytics page will show meaningful data.

## Prerequisites
Phase 0 (cleanup) should be done first so we're seeding against correct models. However, this seeder should be designed to grow — new phases can add seed data for new models (PostRequirements, Announcements, etc.) as they're created.

## Trigger
```bash
# Single command to seed everything
cd backend && node scripts/seed-comprehensive.js

# Or via npm script
cd backend && npm run seed:demo

# Reset and re-seed
cd backend && npm run seed:demo -- --reset
```

Also triggered by env var: `SEED_DEMO=true` on any service startup (runs once, idempotent).

---

## What Gets Created

### The Story
Alaminos City launched BizClear 6 months ago. Since then, 35 business owners have registered. Some are active with approved permits, some are still going through the application process, a few had violations, two businesses are retiring, and there's one appeal in progress. The system has been busy.

---

## Seed Data Inventory

### 1. Users (35 business owners + existing staff)

Keep the existing 9 staff/admin users from `seedDev.js`. Add 35 business owners with realistic Filipino names and emails.

```javascript
const BUSINESS_OWNERS = [
  { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@example.com' },
  { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@example.com' },
  { firstName: 'Rosa', lastName: 'Reyes', email: 'rosa.reyes@example.com' },
  { firstName: 'Pedro', lastName: 'Garcia', email: 'pedro.garcia@example.com' },
  { firstName: 'Elena', lastName: 'Fernandez', email: 'elena.fernandez@example.com' },
  { firstName: 'Carlos', lastName: 'Ramos', email: 'carlos.ramos@example.com' },
  { firstName: 'Ana', lastName: 'Lopez', email: 'ana.lopez@example.com' },
  { firstName: 'Miguel', lastName: 'Torres', email: 'miguel.torres@example.com' },
  { firstName: 'Lucia', lastName: 'Villanueva', email: 'lucia.villanueva@example.com' },
  { firstName: 'Roberto', lastName: 'Cruz', email: 'roberto.cruz@example.com' },
  { firstName: 'Teresa', lastName: 'Mendoza', email: 'teresa.mendoza@example.com' },
  { firstName: 'Gabriel', lastName: 'Aquino', email: 'gabriel.aquino@example.com' },
  { firstName: 'Isabel', lastName: 'Bautista', email: 'isabel.bautista@example.com' },
  { firstName: 'Ricardo', lastName: 'Gonzales', email: 'ricardo.gonzales@example.com' },
  { firstName: 'Carmen', lastName: 'Dizon', email: 'carmen.dizon@example.com' },
  { firstName: 'Antonio', lastName: 'Manalo', email: 'antonio.manalo@example.com' },
  { firstName: 'Dolores', lastName: 'Soriano', email: 'dolores.soriano@example.com' },
  { firstName: 'Fernando', lastName: 'Castillo', email: 'fernando.castillo@example.com' },
  { firstName: 'Rosario', lastName: 'Navarro', email: 'rosario.navarro@example.com' },
  { firstName: 'Ernesto', lastName: 'Pascual', email: 'ernesto.pascual@example.com' },
  { firstName: 'Lourdes', lastName: 'Aguilar', email: 'lourdes.aguilar@example.com' },
  { firstName: 'Manuel', lastName: 'Santiago', email: 'manuel.santiago@example.com' },
  { firstName: 'Pilar', lastName: 'Delos Santos', email: 'pilar.delossantos@example.com' },
  { firstName: 'Andres', lastName: 'Bonifacio', email: 'andres.bonifacio@example.com' },
  { firstName: 'Josefa', lastName: 'Rizal', email: 'josefa.rizal@example.com' },
  { firstName: 'Ramon', lastName: 'Magsaysay', email: 'ramon.magsaysay@example.com' },
  { firstName: 'Corazon', lastName: 'Aquino', email: 'corazon.aquino@example.com' },
  { firstName: 'Emilio', lastName: 'Aguinaldo', email: 'emilio.aguinaldo@example.com' },
  { firstName: 'Remedios', lastName: 'Trinidad', email: 'remedios.trinidad@example.com' },
  { firstName: 'Gregorio', lastName: 'Del Pilar', email: 'gregorio.delpilar@example.com' },
  { firstName: 'Felicidad', lastName: 'Pangilinan', email: 'felicidad.pangilinan@example.com' },
  { firstName: 'Lorenzo', lastName: 'Tan', email: 'lorenzo.tan@example.com' },
  { firstName: 'Esperanza', lastName: 'Sy', email: 'esperanza.sy@example.com' },
  { firstName: 'Danilo', lastName: 'Lim', email: 'danilo.lim@example.com' },
  { firstName: 'Gloria', lastName: 'Co', email: 'gloria.co@example.com' },
]
```

All use password `TempPass123!`. All have `termsAccepted: true`, `role: business_owner`.

### 2. Businesses (80 total across 35 owners) — WITH FULL LIFECYCLE SIMULATION

The seeder doesn't just set a status — it simulates the **entire journey** that led to that status. Every approved business has an officer who reviewed it, a review date, a payment, audit trail entries, and the notifications that would have been generated. Every rejected business has a rejection reason, every retirement has the full inspector-verification chain.

Some owners have multiple businesses. Distribution:

| Status | Count | Description |
|---|---|---|
| `approved` (active) | 35 | Approved permits, operating businesses |
| `under_review` | 8 | Currently being reviewed by LGU officer |
| `submitted` | 7 | Submitted, waiting for officer to start review |
| `needs_revision` | 5 | Sent back for corrections |
| `rejected` | 3 | Rejected applications |
| `draft` | 7 | Partially completed applications |
| `approved` + renewal submitted | 5 | Active businesses that submitted renewals |
| `approved` + renewal draft | 3 | Active businesses with pending renewal |
| `approved` + retirement requested | 2 | Businesses requesting retirement |
| `approved` + retirement confirmed | 2 | Businesses that completed retirement |
| `approved` + retirement rejected | 1 | Retirement request denied |
| `approved` + retirement inspector_verified | 2 | Inspector verified, awaiting confirmation |

#### Lifecycle Simulation Per Status

Each status requires specific fields to be set so the data looks realistic when viewed in the UI:

**`approved` businesses (35):**
```javascript
{
  applicationStatus: 'approved',
  businessStatus: 'active',
  isSubmitted: true,
  submittedToLguOfficer: true,
  submittedAt: randomDate(5, 2),           // submitted 2-5 months ago
  reviewedBy: officerUserId,                // the LGU officer who approved it
  reviewedAt: addDays(submittedAt, randomInt(2, 14)), // 2-14 days after submission
  reviewComments: randomPick([
    'All documents verified. Business registration is complete.',
    'Requirements are in order. Approved for issuance.',
    'Verified with DTI records. Compliant.',
    'Inspection passed. Permit approved.',
  ]),
  applicationReferenceNumber: `BIZ-2025-${String(i).padStart(4, '0')}`,
}
```
Also generate for each approved business:
- 1 `registration_fee` Payment (status: `paid`, paidAt: near reviewedAt)
- 1 AuditLog (`business_application_submitted` at submittedAt)
- 1 AuditLog (`admin_approval` at reviewedAt, performedBy: officerUserId)
- 1 Notification to owner (`application_approved`, createdAt: reviewedAt)
- 1 Notification to officer (`new_application_submitted`, createdAt: submittedAt)

**`under_review` businesses (8):**
```javascript
{
  applicationStatus: 'under_review',
  isSubmitted: true,
  submittedToLguOfficer: true,
  submittedAt: randomDate(1, 0),            // submitted recently (0-1 month ago)
  reviewedBy: officerUserId,                // officer picked it up
  reviewedAt: addDays(submittedAt, randomInt(1, 3)),
  reviewComments: '',                       // still reviewing
  applicationReferenceNumber: `BIZ-2026-${String(i).padStart(4, '0')}`,
}
```
Also generate:
- 1 AuditLog (`business_application_submitted`)
- 1 Notification to officer (`new_application_submitted`)
- 1 Notification to owner (`application_review_started`)

**`submitted` businesses (7):**
```javascript
{
  applicationStatus: 'submitted',
  isSubmitted: true,
  submittedToLguOfficer: true,
  submittedAt: randomDate(0.5, 0),          // submitted in the last 2 weeks
  reviewedBy: null,                         // nobody has picked it up yet
  reviewedAt: null,
  applicationReferenceNumber: `BIZ-2026-${String(i).padStart(4, '0')}`,
}
```
Also generate:
- 1 AuditLog (`business_application_submitted`)
- 1 Notification to ALL officers (`new_application_submitted`)

**`needs_revision` businesses (5):**
```javascript
{
  applicationStatus: 'needs_revision',
  isSubmitted: true,
  submittedToLguOfficer: true,
  submittedAt: randomDate(2, 1),
  reviewedBy: officerUserId,
  reviewedAt: addDays(submittedAt, randomInt(3, 7)),
  reviewComments: randomPick([
    'DTI registration certificate is expired. Please upload a current one.',
    'Barangay clearance is missing. Please obtain and upload.',
    'Business address does not match DTI records. Please clarify.',
    'Fire safety inspection certificate is required before approval.',
    'Incomplete financial documents. Please provide audited statements.',
  ]),
  applicationReferenceNumber: `BIZ-2025-${String(i).padStart(4, '0')}`,
}
```
Also generate:
- 1 AuditLog (`business_application_submitted`)
- 1 AuditLog with action `application_needs_revision` (at reviewedAt)
- 1 Notification to owner (`application_needs_revision`, with the review comment as message)

**`rejected` businesses (3):**
```javascript
{
  applicationStatus: 'rejected',
  isSubmitted: true,
  submittedToLguOfficer: true,
  submittedAt: randomDate(4, 2),
  reviewedBy: officerUserId,
  reviewedAt: addDays(submittedAt, randomInt(5, 10)),
  rejectionReason: randomPick([
    'Business activity is not permitted in this zone per city ordinance.',
    'Applicant has outstanding violations on another registered business.',
    'Fraudulent documents detected during verification.',
  ]),
  reviewComments: 'Application does not meet requirements.',
  applicationReferenceNumber: `BIZ-2025-${String(i).padStart(4, '0')}`,
}
```
Also generate:
- 1 AuditLog (`business_application_submitted`)
- 1 AuditLog (`admin_rejection` at reviewedAt)
- 1 Notification to owner (`application_rejected`, with rejectionReason)

**`draft` businesses (7):**
```javascript
{
  applicationStatus: randomPick(['draft', 'requirements_viewed', 'form_completed']),
  isSubmitted: false,
  submittedToLguOfficer: false,
  submittedAt: null,
  reviewedBy: null,
  reviewedAt: null,
}
```
No audit logs or notifications — the owner hasn't submitted yet.

#### Retirement Lifecycle Simulation

Retirement statuses must include the full approval chain:

**`retirement requested` (2):**
```javascript
{
  // business is approved+active, PLUS:
  retirementStatus: 'requested',
  retirementRequestedAt: randomDate(0.5, 0),  // requested recently
}
```
Also generate:
- 1 Notification to officers (`retirement_request_received`)
- 1 AuditLog (`retirement_requested`)

**`retirement inspector_verified` (2):**
```javascript
{
  retirementStatus: 'inspector_verified',
  retirementRequestedAt: randomDate(1, 0.5),
  inspectorVerifiedClosed: true,
  inspectorVerifiedAt: addDays(retirementRequestedAt, randomInt(3, 7)),
}
```
Also generate:
- 1 Inspection (type: `compliance`, status: `completed`, linked to this business, completedAt = inspectorVerifiedAt)
- 1 Notification to manager (`retirement_inspector_verified`)

**`retirement confirmed` (2):**
```javascript
{
  retirementStatus: 'confirmed',
  businessStatus: 'closed',
  retirementRequestedAt: randomDate(3, 2),
  inspectorVerifiedClosed: true,
  inspectorVerifiedAt: addDays(retirementRequestedAt, 5),
  retirementConfirmedAt: addDays(inspectorVerifiedAt, 3),
}
```
Also generate:
- 1 Inspection + Notification chain from above
- 1 Notification to owner (`retirement_accepted`)
- 1 AuditLog (`business_retired`)

**`retirement rejected` (1):**
```javascript
{
  retirementStatus: 'rejected',
  retirementRequestedAt: randomDate(2, 1),
  retirementRejectionReason: 'Business has outstanding tax obligations that must be settled before retirement can be processed.',
}
```
Also generate:
- 1 Notification to owner (`retirement_rejected`)

#### Renewal Lifecycle Simulation

**Renewal `submitted` (5 businesses):**
```javascript
renewals: [{
  renewalId: `REN-2026-${i}`,
  renewalYear: 2026,
  renewalPeriodStart: new Date('2026-01-01'),
  renewalPeriodEnd: new Date('2026-01-20'),
  periodAcknowledged: true,
  periodAcknowledgedAt: new Date('2026-01-02'),
  grossReceipts: { amount: randomAmount(100000, 5000000), calendarYear: 2025 },
  renewalStatus: 'submitted',
  submittedAt: randomDate(0.5, 0),
  payment: { status: 'pending', amount: randomAmount(1000, 25000) },
  referenceNumber: `REN-2026-${String(i).padStart(4, '0')}`,
}]
```
Also generate:
- 1 AuditLog (`renewal_submitted`)
- 1 Notification to officer (`renewal_submitted`)
- 1 pending Payment record (type: `renewal_fee`)

**Renewal `draft` (3 businesses):**
```javascript
renewals: [{
  renewalId: `REN-2026-${i}`,
  renewalYear: 2026,
  renewalStatus: 'draft',
  periodAcknowledged: false,
  grossReceipts: {},
}]
```
No audit logs or notifications — owner hasn't submitted the renewal yet.

---

**Business types** — realistic Alaminos City businesses:
```javascript
const BUSINESS_TEMPLATES = [
  { name: 'Santos Sari-Sari Store', type: 'sole_proprietorship', lob: 'RET', activities: ['Retail of consumer goods and household items'] },
  { name: 'Dela Cruz Fish Trading', type: 'sole_proprietorship', lob: 'WHL', activities: ['Wholesale of fresh and dried fish products'] },
  { name: 'Reyes Eatery & Catering', type: 'sole_proprietorship', lob: 'FDS', activities: ['Canteen, eatery, food stands, catering services'] },
  { name: 'Garcia Hardware & Construction Supplies', type: 'sole_proprietorship', lob: 'RET', activities: ['Retail of hardware, construction materials, and paints'] },
  { name: 'Fernandez Rice Mill', type: 'sole_proprietorship', lob: 'MFG', activities: ['Rice milling and grain processing'] },
  { name: 'Ramos Auto Repair Shop', type: 'sole_proprietorship', lob: 'SVC', activities: ['Automotive repair and maintenance services'] },
  { name: 'Lopez Pharmacy', type: 'sole_proprietorship', lob: 'RET', activities: ['Retail of pharmaceutical products and medical supplies'] },
  { name: 'Torres Water Refilling Station', type: 'sole_proprietorship', lob: 'UTL', activities: ['Water refilling and delivery services'] },
  { name: 'Villanueva Beach Resort', type: 'sole_proprietorship', lob: 'SVC', activities: ['Resort, lodging, and recreational services'] },
  { name: 'Cruz Bakery', type: 'sole_proprietorship', lob: 'FDS', activities: ['Bakery and pastry production and retail'] },
  { name: 'Mendoza Dress Shop', type: 'sole_proprietorship', lob: 'RET', activities: ['Retail of clothing, garments, and accessories'] },
  { name: 'Aquino Copier & Printing', type: 'sole_proprietorship', lob: 'SVC', activities: ['Printing, photocopying, and document services'] },
  { name: 'Bautista Agri-Supply', type: 'sole_proprietorship', lob: 'AGR', activities: ['Retail of agricultural supplies, feeds, and fertilizers'] },
  { name: 'Gonzales Welding & Fabrication', type: 'sole_proprietorship', lob: 'MFG', activities: ['Metal welding, fabrication, and steel works'] },
  { name: 'Dizon Beauty Salon', type: 'sole_proprietorship', lob: 'SVC', activities: ['Beauty parlor, barber shop, and grooming services'] },
  { name: 'Manalo Internet Cafe', type: 'sole_proprietorship', lob: 'SVC', activities: ['Internet cafe and computer rental services'] },
  { name: 'Soriano Funeral Services', type: 'sole_proprietorship', lob: 'SVC', activities: ['Funeral parlor and memorial services'] },
  { name: 'Castillo Transport Services', type: 'sole_proprietorship', lob: 'TRN', activities: ['Passenger and freight transport services'] },
  { name: 'Navarro Piggery', type: 'sole_proprietorship', lob: 'AGR', activities: ['Hog raising and livestock breeding'] },
  { name: 'Pascual Vulcanizing Shop', type: 'sole_proprietorship', lob: 'SVC', activities: ['Tire vulcanizing and repair'] },
  { name: 'Alaminos Hundred Islands Tours', type: 'partnership', lob: 'SVC', activities: ['Tour operator, boat rentals, island hopping services'] },
  { name: 'Pangasinan Salt Traders', type: 'partnership', lob: 'WHL', activities: ['Wholesale of salt and mineral products'] },
  { name: 'Aguilar Bamboo Crafts', type: 'sole_proprietorship', lob: 'MFG', activities: ['Bamboo furniture and handicraft manufacturing'] },
  { name: 'Santiago General Merchandise', type: 'sole_proprietorship', lob: 'RET', activities: ['General merchandise, dry goods, and novelty items'] },
  { name: 'Poblacion Laundry Express', type: 'sole_proprietorship', lob: 'SVC', activities: ['Laundry and dry cleaning services'] },
  // ... extend to 40+ templates, shuffle and assign to owners
]
```

**Alaminos barangay addresses** (real barangays):
```javascript
const BARANGAYS = [
  { code: '015503001', name: 'Alos' },
  { code: '015503002', name: 'Amandiego' },
  { code: '015503003', name: 'Amangbangan' },
  { code: '015503004', name: 'Balangobong' },
  { code: '015503005', name: 'Balayang' },
  { code: '015503006', name: 'Bisocol' },
  { code: '015503007', name: 'Bolaney' },
  { code: '015503008', name: 'Bued' },
  { code: '015503009', name: 'Cabatuan' },
  { code: '015503010', name: 'Cayucay' },
  { code: '015503011', name: 'Dulacac' },
  { code: '015503012', name: 'Inerangan' },
  { code: '015503013', name: 'Landoc' },
  { code: '015503014', name: 'Linmansangan' },
  { code: '015503015', name: 'Lucap' },
  { code: '015503016', name: 'Magsaysay' },
  { code: '015503017', name: 'Mona' },
  { code: '015503018', name: 'Palamis' },
  { code: '015503019', name: 'Pandan' },
  { code: '015503021', name: 'Poblacion' },
  { code: '015503022', name: 'Quezon' },
  { code: '015503023', name: 'Sabangan' },
  { code: '015503024', name: 'Tanalong' },
  { code: '015503025', name: 'Tangcarang' },
  { code: '015503026', name: 'Tawintawin' },
  { code: '015503027', name: 'Telbang' },
  { code: '015503028', name: 'Victoria' },
]
```

Each business gets: `businessName`, `businessType`, `registrationAgency: 'DTI'`, `businessRegistrationNumber` (random DTI format), `businessActivities`, a random barangay address, `capital` (randomized 50K-5M), and `submittedAt` (randomized over the last 6 months).

### 3. Inspections (40 total) — WITH LIFECYCLE

| Status | Count | Type |
|---|---|---|
| `completed` | 25 | 15 initial, 5 renewal, 3 follow_up, 2 compliance |
| `pending` | 10 | 5 initial, 3 renewal, 2 complaint |
| `in_progress` | 5 | 3 initial, 2 follow_up |

**`completed` inspections (25):**
```javascript
{
  inspectorId: inspectorUserId,
  businessProfileId: profile._id,
  businessId: business.businessId,
  inspectionType: randomPick(['initial', 'renewal', 'follow_up', 'compliance']),
  status: 'completed',
  scheduledDate: randomDate(4, 1),
  assignedBy: managerUserId,
  assignedAt: addDays(scheduledDate, -7),       // assigned a week before
  startedAt: scheduledDate,                      // started on schedule
  completedAt: addHours(scheduledDate, randomInt(1, 4)),  // took 1-4 hours
  submittedAt: addHours(completedAt, 1),         // submitted report 1hr after
  overallResult: randomWeighted({ passed: 70, failed: 20, needs_reinspection: 10 }),
  checklist: generateChecklist(),                // see below
  evidence: [{ fileName: 'storefront.jpg', url: '/placeholder/evidence.jpg', uploadedAt: completedAt }],
  isImmutable: true,
}
```
For each completed inspection, also generate:
- 1 AuditLog (`inspection_completed`)
- 1 Notification to manager (`inspection_completed`)
- 1 Notification to owner (`inspection_completed`, with result)

**`pending` inspections (10, including 3 overdue):**
```javascript
{
  status: 'pending',
  scheduledDate: isOverdue ? randomDate(0.5, 0.1) : futureDate(7, 30),  // overdue = past date
  assignedBy: managerUserId,
  assignedAt: addDays(scheduledDate, -5),
  // no startedAt, completedAt, overallResult, etc.
}
```
For each, generate:
- 1 Notification to inspector (`inspection_assigned`)

**3 overdue inspections** have `scheduledDate` in the past but status still `pending` — these show up in the manager dashboard "overdue" alert.

**`in_progress` inspections (5):**
```javascript
{
  status: 'in_progress',
  scheduledDate: randomDate(0.1, 0),       // scheduled within last 3 days
  startedAt: scheduledDate,                 // inspector started
  assignedBy: managerUserId,
  // no completedAt — still working
}
```

**Checklist generator:**
```javascript
function generateChecklist() {
  const items = [
    { label: 'Fire extinguisher present and accessible', category: 'Fire Safety' },
    { label: 'Fire exit signage visible and illuminated', category: 'Fire Safety' },
    { label: 'Sanitary permit displayed', category: 'Sanitation' },
    { label: 'Food handling area clean and sanitized', category: 'Sanitation' },
    { label: 'Business permit prominently displayed', category: 'Compliance' },
    { label: 'Correct business name on signage', category: 'Compliance' },
    { label: 'Waste disposal system adequate', category: 'Environmental' },
    { label: 'Occupancy limit posted and observed', category: 'Safety' },
    { label: 'Emergency exits unobstructed', category: 'Fire Safety' },
    { label: 'Electrical wiring safe and up to code', category: 'Safety' },
  ]
  return randomSubset(items, 5, 8).map(item => ({
    ...item,
    passed: Math.random() > 0.15,  // 85% pass rate per item
    notes: '',
  }))
}
```

### 4. Violations (18 total) — WITH LIFECYCLE

| Status | Count | Severity |
|---|---|---|
| `open` | 8 | 2 critical, 3 major, 3 minor |
| `resolved` | 7 | 2 major, 5 minor |
| `appealed` | 3 | 1 critical, 2 major |

Each violation is linked to a `completed` inspection with `overallResult: 'failed'`.

**`open` violations (8):**
```javascript
{
  inspectionId: failedInspection._id,
  inspectorId: inspectorUserId,
  violationType: 'No valid fire safety inspection certificate',
  description: 'The business premises lacks a current fire safety inspection certificate. The most recent certificate expired on 2025-08-15.',
  severity: 'critical',
  status: 'open',
  issuedAt: failedInspection.completedAt,
  complianceDeadline: addDays(issuedAt, 30),
  legalBasis: 'RA 9514 - Fire Code of the Philippines',
}
```
For each open violation, generate:
- 1 Notification to owner (`violation_issued`, with violationType and deadline)
- 1 Notification to manager (`violation_escalated` for critical severity only)
- 1 AuditLog (`violation_issued`)

**`resolved` violations (7):**
```javascript
{
  status: 'resolved',
  issuedAt: randomDate(4, 2),
  complianceDeadline: addDays(issuedAt, 30),
  // resolved BEFORE the deadline
  acknowledgedAt: addDays(issuedAt, randomInt(10, 25)),
  acknowledgedBy: ownerUserId,
}
```
For each resolved violation, generate:
- 1 Notification to owner (`violation_issued` at issuedAt)
- 1 Notification to owner (`violation_resolved` at acknowledgedAt)
- 2 AuditLogs (issued + resolved)

**`appealed` violations (3):**
```javascript
{
  status: 'appealed',
  issuedAt: randomDate(3, 1),
  complianceDeadline: addDays(issuedAt, 30),
}
```
These are linked to the Appeal records (see section 5).

**Violation templates:**
```javascript
const VIOLATION_TEMPLATES = [
  { type: 'No valid fire safety inspection certificate', severity: 'critical', legal: 'RA 9514' },
  { type: 'Obstruction of fire exit', severity: 'critical', legal: 'RA 9514 Section 7' },
  { type: 'Expired sanitary permit', severity: 'major', legal: 'PD 856 - Sanitation Code' },
  { type: 'Improper waste disposal', severity: 'major', legal: 'RA 9003 - Ecological Waste Mgmt' },
  { type: 'Operating beyond permitted hours', severity: 'major', legal: 'City Ordinance No. 2019-05' },
  { type: 'Unauthorized building modification', severity: 'major', legal: 'PD 1096 - Building Code' },
  { type: 'Missing business permit display', severity: 'minor', legal: 'RA 7160 Section 152' },
  { type: 'Non-compliance with occupancy limits', severity: 'minor', legal: 'PD 1096 Section 1004' },
  { type: 'Signage not conforming to city ordinance', severity: 'minor', legal: 'City Ordinance No. 2020-12' },
  { type: 'Failure to maintain cleanliness standards', severity: 'minor', legal: 'PD 856 Section 13' },
]
```

### 5. Appeals (8 total) — WITH LIFECYCLE

| Status | Count | Origin |
|---|---|---|
| `submitted` | 3 | 2 from violations, 1 from rejection |
| `under_review` | 2 | 1 from violation, 1 from rejection |
| `approved` | 2 | Both from violations (violation status changed to `resolved` after appeal approval) |
| `rejected` | 1 | From violation (violation remains `open`) |

**`submitted` appeals (3):**
```javascript
{
  businessId: business.businessId,
  requestedBy: ownerUserId,
  appealType: 'wrong_violations',
  status: 'submitted',
  description: 'The cited violation for "expired sanitary permit" was already rectified prior to the inspection date. We renewed our sanitary permit on September 3, 2025 and have the receipt to prove it.',
  createdAt: randomDate(0.3, 0),  // filed recently
}
```
For each, generate:
- 1 Notification to officers (`appeal_submitted`)
- 1 AuditLog (`appeal_submitted`)

**`under_review` appeals (2):**
```javascript
{
  status: 'under_review',
  createdAt: randomDate(0.5, 0.2),
  // a manager or officer picked it up but hasn't decided yet
}
```
For each, generate:
- 1 Notification to owner (`appeal_under_review`)

**`approved` appeals (2):**
```javascript
{
  status: 'approved',
  createdAt: randomDate(2, 1),
  resolvedAt: addDays(createdAt, randomInt(5, 15)),
  resolvedBy: managerUserId,
  resolutionNotes: 'Upon review, the violation was issued in error. The business had already obtained the required certification before the inspection.',
}
```
For each, generate:
- The linked violation should have its status set to `appealed` (or if you want to show the full chain, set it to `resolved` with `acknowledgedAt = appeal.resolvedAt`)
- 1 Notification to owner (`appeal_approved`)
- 1 AuditLog (`appeal_resolved`, metadata: { outcome: 'approved' })

**`rejected` appeal (1):**
```javascript
{
  status: 'rejected',
  createdAt: randomDate(2, 1),
  resolvedAt: addDays(createdAt, randomInt(7, 20)),
  resolvedBy: managerUserId,
  resolutionNotes: 'The appeal does not present new evidence. The original violation stands. The business must comply within the original deadline.',
}
```
For this, generate:
- 1 Notification to owner (`appeal_rejected`)
- 1 AuditLog (`appeal_resolved`, metadata: { outcome: 'rejected' })

### 6. Payments (55 total) — LINKED TO BUSINESS LIFECYCLE

Every payment is linked to a specific event in the system. No orphan payments.

| Type | Count | Status | Linked To |
|---|---|---|---|
| `registration_fee` | 25 | 23 paid, 2 pending | Each approved business gets a paid registration fee. 2 `under_review` businesses have pending fees. |
| `renewal_fee` | 15 | 12 paid, 3 pending | Paid: last year's renewals. Pending: this year's submitted renewals. |
| `penalty` | 8 | 5 paid, 3 pending | Late renewal surcharges for businesses that renewed after Jan 20. |
| `violation_fine` | 5 | 3 paid, 2 pending | Fines from resolved violations (paid) and open violations (pending). |
| `general_permit_fee` | 2 | 2 paid | Businesses that also obtained general permits (events, etc.). |

**`paid` payments:**
```javascript
{
  paymentId: `PAY-2025-${String(i).padStart(4, '0')}`,
  userId: ownerUserId,
  businessId: business.businessId,
  amount: randomAmount(500, 15000),
  paymentMethod: randomWeighted({ cash: 60, gcash: 25, bank_transfer: 15 }),
  status: 'paid',
  paidAt: addDays(business.reviewedAt || business.submittedAt, randomInt(0, 3)),  // paid around approval time
  relatedEntityType: 'registration_fee',
  _seedDemo: true,
}
```
For each paid payment, generate:
- 1 Notification to owner (`payment_received`)
- 1 AuditLog (`payment_recorded`)

**`pending` payments:**
```javascript
{
  status: 'pending',
  paidAt: null,
  // due date = 7 days from creation
  createdAt: randomDate(0.3, 0),
}
```
For each pending payment, generate:
- 1 Notification to owner (`payment_due_reminder`) if due within 7 days

### 7. Renewals (8 businesses with renewals)

5 businesses have `renewalStatus: 'submitted'`, 3 have `renewalStatus: 'draft'`.

Each renewal has:
- `renewalYear: 2026`
- `renewalPeriodStart/End`
- `grossReceipts` → randomized (₱100K-₱5M)
- `assessment` → computed from fee configuration
- `payment` → for submitted renewals, link to a Payment record

### 8. Notifications (200+ total) — GENERATED FROM LIFECYCLE EVENTS

Most notifications are already created as part of the business/inspection/violation/appeal/payment seeding above. This section covers the **additional** notifications and the read/unread strategy.

**Already generated from lifecycle (estimated counts):**
- ~35 `application_approved` (one per approved business → owner)
- ~80 `new_application_submitted` (one per non-draft business → officers)
- ~8 `application_needs_revision` (→ owners of needs_revision businesses)
- ~3 `application_rejected` (→ owners of rejected businesses)
- ~40 `inspection_assigned` (one per inspection → inspector)
- ~25 `inspection_completed` (→ manager + owner)
- ~8 `violation_issued` (→ owners)
- ~7 `violation_resolved` (→ owners)
- ~8 `appeal_submitted` / resolved / rejected
- ~35 `payment_received` (→ owners)
- Various retirement notifications

**Additional notifications to generate:**

| User Type | Extra Count | Types | Purpose |
|---|---|---|---|
| Admin | 5 | `security_alert` | Simulates failed login attempts, suspicious activity |
| Admin | 3 | `tamper_incident` | Simulates audit integrity warnings |
| Inspector | 3 | `inspection_schedule_changed` | Simulates rescheduled inspections |
| All owners | 1 each | `renewal_period_started` | January renewal reminder |

**Read/unread strategy:**
- Notifications older than 7 days: `read: true` (80%)
- Notifications within last 7 days: `read: false` (70%) — ensures fresh unread badges
- This means every role logs in and immediately sees unread notification counts
- Timestamps match the lifecycle events (a `payment_received` notification has the same `createdAt` as the payment's `paidAt`)

### 9. Audit Logs (300+ entries) — GENERATED FROM LIFECYCLE EVENTS

Most audit log entries are already created as part of the business/inspection/violation lifecycle seeding above. This section covers the **additional** audit entries that simulate system activity.

**Already generated from lifecycle (estimated counts):**
- ~73 `business_application_submitted` (one per non-draft business)
- ~35 `admin_approval` (one per approved business, performedBy: officerUserId)
- ~3 `admin_rejection` (one per rejected business, performedBy: officerUserId)
- ~25 `inspection_completed` (one per completed inspection)
- ~18 `violation_issued` / `violation_resolved`
- ~8 `appeal_submitted` / `appeal_resolved`
- ~35 `payment_recorded`
- ~4 `retirement_requested` / `retirement_confirmed`

**Additional audit entries to generate (simulating routine system activity):**

```javascript
const EXTRA_AUDIT_EVENTS = [
  // Login activity — spread across all staff over 6 months
  ...generateLoginEvents(allStaffUsers, 80),    // 80 login events
  // Document uploads by business owners
  ...generateDocUploadEvents(approvedBusinesses, 50),  // 50 document_upload events
  // Business profile updates
  ...generateBusinessUpdateEvents(approvedBusinesses, 20), // 20 business_updated events
  // Fee config changes by admin
  ...generateFeeConfigEvents(adminUserId, 10),  // 10 fee_config_created events
  // System events
  { eventType: 'system_startup', createdAt: randomDate(6, 0), metadata: { version: '1.0.0' } },
  { eventType: 'seed_completed', createdAt: randomDate(6, 6), metadata: { records: 'initial' } },
]
```

Each audit entry has:
- `eventType` — matches the action
- `performedBy` — the user who did it (ObjectId)
- `metadata` — contextual info (businessId, applicationRef, IP address for logins, etc.)
- `createdAt` — realistic timestamp in chronological order
- `_seedDemo: true`
- `blockchainStatus: 'skipped'` — seeder bulk-inserts audit logs, so they don't go through `createAuditLog` and thus don't get forwarded to the blockchain. This is intentional for dev seeding speed. The `retryFailedAnchors` cron (from Phase 4C-A) will pick them up and anchor them later if Ganache is running.
- `hash` — compute via the same `calculateAuditHash` function used by `createAuditLog` so that the `verifyAuditIntegrity` cron doesn't flag them as tampered

### 10. Announcements (if model exists after Phase 4)

```javascript
const ANNOUNCEMENTS = [
  {
    title: 'Renewal Period Now Open for 2026',
    body: 'All business owners are reminded that the renewal period for business permits is from January 1 to January 20, 2026. Late renewals will incur a 25% surcharge plus 2% monthly interest.',
    priority: 'high',
    isActive: true,
  },
  {
    title: 'New Online Payment Options Available',
    body: 'BizClear now accepts GCash and Maya payments for business permit fees. Visit the Payments section of your dashboard to pay online.',
    priority: 'normal',
    isActive: true,
  },
  {
    title: 'System Maintenance — March 5, 2026',
    body: 'BizClear will undergo scheduled maintenance on March 5, 2026 from 10 PM to 2 AM. The system will be unavailable during this time.',
    priority: 'normal',
    isActive: true,
    expiresAt: new Date('2026-03-06'),
  },
  {
    title: 'Hundred Islands Festival Business Permits',
    body: 'Special permits for the Hundred Islands Festival (April 2026) are now available. Vendors can apply through the General Permits section.',
    priority: 'normal',
    isActive: true,
  },
]
```

---

## Script Structure

**File:** `backend/scripts/seed-comprehensive.js`

```javascript
#!/usr/bin/env node
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Models (require from each service)
const User = require('../services/auth-service/src/models/User')
const Role = require('../services/auth-service/src/models/Role')
const BusinessProfile = require('../services/business-service/src/models/BusinessProfile')
const Inspection = require('../services/business-service/src/models/Inspection')
const Violation = require('../services/business-service/src/models/Violation')
const Appeal = require('../services/business-service/src/models/Appeal')
const Payment = require('../services/business-service/src/models/Payment')
const Notification = require('../services/auth-service/src/models/Notification')
const AuditLog = require('../services/business-service/src/models/AuditLog')
// ... other models as needed

const RESET = process.argv.includes('--reset')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizclear')

  if (RESET) {
    console.log('Resetting demo data...')
    await clearDemoData()
  }

  console.log('Seeding comprehensive demo data...')

  // Look up existing staff users from seedDev.js
  const staff = await lookupStaffUsers()  // { officer, manager, inspector, admin }

  // Order matters — each step depends on the previous, and each step
  // generates its own lifecycle artifacts (notifications, audit logs, payments)
  const owners = await seedBusinessOwners()       // 35 users
  const { businesses, notifications: bizNotifs, auditLogs: bizLogs, payments: bizPayments }
    = await seedBusinesses(owners, staff)          // 80 businesses + lifecycle artifacts
  const { inspections, notifications: inspNotifs, auditLogs: inspLogs }
    = await seedInspections(businesses, staff)     // 40 inspections + lifecycle
  const { violations, notifications: violNotifs, auditLogs: violLogs }
    = await seedViolations(inspections, staff)     // 18 violations + lifecycle
  const { appeals, notifications: appealNotifs, auditLogs: appealLogs }
    = await seedAppeals(businesses, violations, owners, staff) // 8 appeals + lifecycle
  const extraPayments = await seedExtraPayments(businesses, owners, violations) // penalty/fine payments
  const extraAuditLogs = await seedExtraAuditLogs(owners, staff, businesses)    // login, upload, etc.
  const extraNotifs = await seedExtraNotifications(owners, staff)                // security, renewal reminders
  await seedAnnouncements()                        // 4 announcements (if model exists)

  // Bulk insert all collected artifacts
  const allNotifications = [...bizNotifs, ...inspNotifs, ...violNotifs, ...appealNotifs, ...extraNotifs]
  const allAuditLogs = [...bizLogs, ...inspLogs, ...violLogs, ...appealLogs, ...extraAuditLogs]
  const allPayments = [...bizPayments, ...extraPayments]
  await Notification.insertMany(allNotifications)
  await AuditLog.insertMany(allAuditLogs)
  await Payment.insertMany(allPayments)

  console.log('Done! Demo data seeded successfully.')
  console.log(`  ${owners.length} business owners`)
  console.log(`  ${businesses.length} businesses`)
  console.log(`  ${inspections.length} inspections`)
  console.log(`  ${violations.length} violations`)
  console.log(`  ${appeals.length} appeals`)
  console.log(`  ${payments.length} payments`)

  await mongoose.disconnect()
}

async function clearDemoData() {
  // Only clear records created by this seeder
  // Users: identified by @example.com email domain
  await User.deleteMany({ email: { $regex: /@example\.com$/ } })
  // All other models: identified by _seedDemo flag (see Idempotency section)
  await BusinessProfile.deleteMany({ _seedDemo: true })
  await Inspection.deleteMany({ _seedDemo: true })
  await Violation.deleteMany({ _seedDemo: true })
  await Appeal.deleteMany({ _seedDemo: true })
  await Payment.deleteMany({ _seedDemo: true })
  await Notification.deleteMany({ _seedDemo: true })
  await AuditLog.deleteMany({ _seedDemo: true })
}
```

### Idempotency

**Important:** Mongoose uses `strict: true` by default, which silently drops fields not in the schema. The `metadata` approach requires one of these strategies:

**Strategy A (recommended): Use email convention for identification.**
All seeded business owner emails use the `@example.com` domain. For non-User records, add a `_seedDemo: true` field to each model schema (a simple Boolean, default `undefined`, indexed):
```javascript
// Add to each model schema used by the seeder (BusinessProfile, Inspection, Violation, etc.):
_seedDemo: { type: Boolean, default: undefined, index: true, sparse: true },
```
Then cleanup uses: `await BusinessProfile.deleteMany({ _seedDemo: true })`
And idempotency check: `const existing = await User.countDocuments({ email: { $regex: /@example\.com$/ } })`

**Strategy B: Set `strict: false` on the seeder's Mongoose connection.**
```javascript
mongoose.set('strict', false) // Allow arbitrary fields
```
Then use `metadata: { seed: 'demo' }` as originally planned. But this is riskier — it disables schema validation for all operations in the script.

**Strategy A is preferred** because it keeps schema validation intact and the `_seedDemo` field is explicit.

- Before creating, check if demo data already exists: `const existing = await User.countDocuments({ email: { $regex: /@example\\.com$/ } }); if (existing > 0) { console.log('Demo data already exists. Use --reset to re-seed.'); return; }`

### Helper Functions
```javascript
function randomDate(startMonthsAgo, endMonthsAgo = 0) {
  const now = Date.now()
  const start = now - startMonthsAgo * 30 * 24 * 60 * 60 * 1000
  const end = now - endMonthsAgo * 30 * 24 * 60 * 60 * 1000
  return new Date(start + Math.random() * (end - start))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function futureDate(minDays, maxDays) {
  return addDays(new Date(), randomInt(minDays, maxDays))
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomWeighted(weights) {
  // weights = { cash: 60, gcash: 25, bank_transfer: 15 }
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [key, weight] of entries) {
    r -= weight
    if (r <= 0) return key
  }
  return entries[0][0]
}

function randomSubset(array, min, max) {
  const count = randomInt(min, Math.min(max, array.length))
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function lookupStaffUsers() {
  // Look up the 9 staff/admin users already created by seedDev.js
  const officer = await User.findOne({ email: 'officer@example.com' }).lean()
  const manager = await User.findOne({ email: 'manager@example.com' }).lean()
  const inspector = await User.findOne({ email: 'inspector@example.com' }).lean()
  const admin = await User.findOne({ email: 'admin@example.com' }).lean()
  if (!officer || !manager || !inspector || !admin) {
    throw new Error('Staff users not found. Run SEED_DEV=true first.')
  }
  return { officer, manager, inspector, admin }
}
```

---

## Package.json Scripts

**File:** `backend/package.json`

Add:
```json
{
  "scripts": {
    "seed:demo": "node scripts/seed-comprehensive.js",
    "seed:demo:reset": "node scripts/seed-comprehensive.js --reset"
  }
}
```

---

## Environment Variable

Add `SEED_DEMO=true` to `docker-compose.dev.yml` for the auth-service (or a shared entrypoint). When this is set, run the comprehensive seeder after the existing dev seed completes.

---

## What Each Role Sees After Seeding

### Business Owner (e.g., maria.santos@example.com)
- Left panel: 2-3 businesses at various stages (one approved with payments, one draft, etc.)
- **Approved business detail panel:**
  - Overview tab: Business info, approval date, reviewed by "Officer Name", review comments
  - Payments tab: Registration fee (paid), with receipt reference and date
  - Compliance tab: 1-2 completed inspections with checklist results, possibly a resolved violation
  - Permits tab: Active permit with reference number
- **Pending business:** Shows "Under Review" status with submitted date
- **Draft business:** Shows partially filled form, editable
- Notifications badge: 5-10 notifications — "Application Approved", "Payment Confirmed", "Inspection Scheduled", etc.
- Each notification has a realistic timestamp matching the event it describes

### LGU Officer (officer@example.com)
- Dashboard: "15 Pending Applications" count (7 submitted + 8 under_review)
- PermitReviewPage: 15 applications to review — clicking any shows full details:
  - Business name, owner name, submitted date
  - For `under_review`: officer's name as reviewer, review started date
  - For `submitted`: no reviewer yet — officer can claim it
- Past activity: Can see the 35 businesses they previously approved, 3 they rejected, 5 they sent back for revision — all with review comments and timestamps
- Notifications: "New Application Received" for each recently submitted business

### LGU Manager (manager@example.com)
- Dashboard KPIs all show real numbers: 80 total permits, 15 pending, 35 approved, 43 violations, etc.
- Overview pages: Tables with paginated data — click any row to see full details with the officer who reviewed it and when
- Reports: Real KPIs computed from actual data (not mock 1247/78.5%/5.2)
- Recent Activity: Full timeline showing submissions, approvals, rejections, inspections, violations in chronological order
- Overdue alerts: 3 overdue inspections flagged (scheduled date passed, status still pending)
- Cessation overview: 7 businesses in various retirement stages with full chains

### Inspector (inspector@example.com)
- 10 pending inspections assigned by the manager — each with scheduled date, business name, address, type
- 5 in-progress — started but not yet submitted
- 25 completed in history — each with checklist results, evidence, overall result, time taken
- Violations tab: 8 open violations across various businesses they inspected
- Notifications: 40 "Inspection Assigned" notifications matching each assignment

### Admin (admin@example.com)
- Dashboard: Real KPI cards — 35 active businesses, 15 pending applications, revenue from 55 payments
- Finance Overview: Total collections = sum of all paid payments (~₱350K+)
- Finance Transactions: 55 payment records with dates, amounts, methods, statuses
- User management: 44 users (9 staff + 35 owners) — each with their activity history
- Announcements: 4 announcements (renewal period, online payments, maintenance, festival)

---

## Edge Cases
- Seeder must handle models that don't exist yet (e.g., Announcement, PostRequirement) — try/catch and skip
- Staff users (officer, manager, inspector, admin) must already exist from `seedDev.js` — seeder should error clearly if they're missing
- Payments need valid `businessProfileId` references — seed businesses first, then payments
- Violations must reference valid inspections — seed inspections first
- Appeals must reference valid businesses and violations — seed those first
- All `reviewedBy`, `assignedBy`, `inspectorId`, `resolvedBy` fields must point to real staff user ObjectIds
- Timestamps must be chronologically consistent: `submittedAt < reviewedAt < paidAt`; `scheduledDate < startedAt < completedAt`; `issuedAt < acknowledgedAt`
- The `--reset` flag should ONLY delete records created by the seeder (`_seedDemo: true` or `@example.com` emails), never touching manually created data
- Approved businesses with violations: the violation's inspection must be linked to THAT business (not a random one)
- Resolved violations: `acknowledgedAt` must be BEFORE `complianceDeadline` (they complied on time)

## Acceptance Criteria
1. Running `npm run seed:demo` creates 700+ records across 10+ collections in under 30 seconds
2. Every dashboard for every role shows meaningful, non-zero data
3. LGU Manager dashboard KPIs are all populated and match real aggregation counts
4. Finance tabs show payment records with correct totals
5. Notification badges show unread counts for all roles
6. PermitReviewPage has 15 applications to review — clicking any shows a fully populated detail panel with reviewer info
7. Inspector has 10 pending + 5 in-progress + 25 completed inspections with full checklist data
8. Approved businesses show the officer who approved them, the approval date, and review comments
9. Rejected businesses show rejection reasons
10. Violations link back to real inspections with real inspectors
11. Appeals link back to real violations or rejections
12. All timestamps are chronologically consistent (no "reviewed before submitted" anomalies)
13. Running `npm run seed:demo` twice is safe (idempotent)
14. Running `npm run seed:demo:reset` clears only demo data, not manual data
15. All seeded data passes model validation (no validation errors)

## Rollback Plan
`npm run seed:demo:reset` removes all demo data. Existing dev seed data (`SEED_DEV=true`) is untouched.
