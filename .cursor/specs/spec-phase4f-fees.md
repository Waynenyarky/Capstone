# Phase 4F: Unify Fee Taxonomy to Alaminos

## Overview
Resolve the three-way taxonomy mismatch between PSIC codes (a-u), LOB codes (RET, WHL, FDS...), and Charter tax codes (1-12). Create a unified fee lookup that works with the AI recommendation output.

## Prerequisites
Phase 0, 4 (fee configuration UI must be verified working).

---

## The Problem

### Three conflicting taxonomies:

1. **PSIC 2019 codes** (a-u): Used by the Philippine Statistics Authority. The AI model's `lineOfBusiness.js` maps LOB categories to these.
2. **LOB codes** (RET, WHL, FDS, MFG, SVC, etc.): Used in `backend/shared/constants/lineOfBusiness.js`. The AI model predicts these `taxCode` values.
3. **Charter tax codes** (1-12) + descriptive sentences: The Alaminos City Revenue Code uses numbered sections (e.g., "Section 2A.01" for retailers, "Section 3B.03" for manufacturers). The `FeeConfiguration` documents in MongoDB use these descriptions as LOB identifiers.

### Where it breaks:
- AI model predicts `taxCode: "RET"` (a LOB code)
- `feeCalculator.getFeeConfig(lineOfBusiness)` looks up by LOB description (case-insensitive string match)
- The `FeeConfiguration` collection stores entries like `{ lineOfBusiness: "Retail" }` or `{ lineOfBusiness: "Section 2A.01 - Retailers" }`
- Mismatch: AI output `"RET"` ≠ FeeConfig key `"Retail"` ≠ Charter reference `"Section 2A.01"`

---

## Solution: Mapping Layer

### Step 1: Standardize FeeConfiguration entries

**File:** `backend/services/business-service/src/seed/seedFeeConfigurations.js` (new or update existing)

Create a canonical mapping:

```javascript
const FEE_TAXONOMY = [
  { taxCode: 'RET', label: 'Retail', charterRef: 'Section 2A.01', psicCodes: ['g'] },
  { taxCode: 'WHL', label: 'Wholesale', charterRef: 'Section 2B.01', psicCodes: ['g'] },
  { taxCode: 'FDS', label: 'Food Service', charterRef: 'Section 2C.01', psicCodes: ['i'] },
  { taxCode: 'MFG', label: 'Manufacturing', charterRef: 'Section 3B.03', psicCodes: ['c'] },
  { taxCode: 'SVC', label: 'Services', charterRef: 'Section 2D.01', psicCodes: ['j','k','l','m','n','p','q','r','s'] },
  { taxCode: 'FIN', label: 'Financial', charterRef: 'Section 2E.01', psicCodes: ['k'] },
  { taxCode: 'REL', label: 'Real Estate', charterRef: 'Section 2F.01', psicCodes: ['l'] },
  { taxCode: 'TRN', label: 'Transportation', charterRef: 'Section 3A.01', psicCodes: ['h'] },
  { taxCode: 'AGR', label: 'Agriculture', charterRef: 'Section 3C.01', psicCodes: ['a','b'] },
  { taxCode: 'CON', label: 'Construction', charterRef: 'Section 3D.01', psicCodes: ['f'] },
  { taxCode: 'MIN', label: 'Mining', charterRef: 'Section 3E.01', psicCodes: ['b'] },
  { taxCode: 'UTL', label: 'Utilities', charterRef: 'Section 3F.01', psicCodes: ['d','e'] },
]
```

### Step 2: Add `taxCode` field to FeeConfiguration model

**File:** `backend/services/business-service/src/models/FeeConfiguration.js`

> **Important:** FeeConfiguration lives in business-service, NOT admin-service.

```javascript
// Add to schema:
taxCode: { type: String, index: true, unique: true, sparse: true },
```

### Step 3: Update feeCalculator to support taxCode lookup

**File:** `backend/services/business-service/src/lib/feeCalculator.js`

```javascript
async function getFeeConfig(lineOfBusinessOrTaxCode) {
  // Try exact taxCode match first
  let config = await FeeConfiguration.findOne({
    taxCode: lineOfBusinessOrTaxCode.toUpperCase(),
    isActive: true,
  }).lean()

  if (config) return config

  // Fall back to label match (case-insensitive)
  config = await FeeConfiguration.findOne({
    lineOfBusiness: { $regex: new RegExp(`^${lineOfBusinessOrTaxCode}$`, 'i') },
    isActive: true,
  }).lean()

  if (config) return config

  // Try partial match
  config = await FeeConfiguration.findOne({
    lineOfBusiness: { $regex: new RegExp(lineOfBusinessOrTaxCode, 'i') },
    isActive: true,
  }).lean()

  return config || null
}
```

### Step 4: Include barangayClearanceFee

**Current:** `computeApplicationFees` does not include barangay clearance fee.

**Fix:** Add to the fee computation:
```javascript
async function computeApplicationFees({ businessActivities, areaSqm, isHouseForRent }) {
  // ... existing fee calculations ...

  // Add barangay clearance fee (if applicable)
  const barangayClearanceFee = regulatoryConfig?.barangayClearanceFee || 0

  return {
    ...existingFees,
    barangayClearanceFee,
    totalFees: existingTotal + barangayClearanceFee,
  }
}
```

### Step 5: Public fee preview endpoint

**File:** `backend/services/business-service/src/routes/fees.js` (new)

```javascript
// GET /api/business/fee-preview?lob=RET&grossSales=500000&areaSqm=50
router.get('/fee-preview', async (req, res) => {
  const { lob, grossSales, areaSqm } = req.query
  if (!lob) return respond.error(res, 400, 'missing_lob', 'Line of business is required')

  try {
    const feeConfig = await getFeeConfig(lob)
    if (!feeConfig) return respond.error(res, 404, 'no_fee_config', 'No fee configuration found for this LOB')

    const fees = await computeApplicationFees({
      businessActivities: [{ lineOfBusiness: lob }],
      areaSqm: parseFloat(areaSqm) || 0,
      isHouseForRent: false,
    })

    return respond.success(res, 200, {
      lineOfBusiness: feeConfig.lineOfBusiness,
      taxCode: feeConfig.taxCode,
      fees,
    })
  } catch (err) {
    return respond.error(res, 500, 'fee_calc_error', err.message)
  }
})
```

This allows business owners to preview fees before submitting an application.

### Step 6: Migrate existing FeeConfiguration documents

Create a migration script in **business-service** (where the FeeConfiguration model lives):

**File:** `backend/services/business-service/src/migrations/addTaxCodesToFeeConfig.js` (new)

```javascript
const FEE_TAXONOMY = require('../../shared/constants/feeTaxonomy') // or inline the mapping
const FeeConfiguration = require('../models/FeeConfiguration')

async function migrate() {
  for (const entry of FEE_TAXONOMY) {
    await FeeConfiguration.updateMany(
      { lineOfBusiness: { $regex: new RegExp(`^${entry.label}$`, 'i') } },
      { $set: { taxCode: entry.taxCode } }
    )
  }
  console.log('Migration complete: taxCodes added to FeeConfiguration')
}

module.exports = { migrate }
```

The `FEE_TAXONOMY` constant from Step 1 should be placed in `backend/shared/constants/feeTaxonomy.js` so both business-service and admin-service can reference it.

---

## Edge Cases
- Business with multiple LOBs should compute fees for each and sum
- If a FeeConfiguration entry has no taxCode yet, the label fallback must work
- The AI model may predict a taxCode that has no FeeConfiguration — show a warning to the user
- Migration must be idempotent (running twice doesn't break anything)

## Acceptance Criteria
1. AI taxCode output (e.g., "RET") resolves to the correct FeeConfiguration
2. `feeCalculator.getFeeConfig("RET")` returns the Retail fee config
3. `feeCalculator.getFeeConfig("Retail")` still works (backward compatible)
4. Barangay clearance fee is included in total computation
5. Fee preview endpoint returns correct fees for any LOB
6. Existing FeeConfiguration documents have taxCode populated via migration
7. Admin fee configuration UI still works after schema change

## Rollback Plan
Remove `taxCode` field from FeeConfiguration. Revert feeCalculator changes. The preview endpoint is additive and can be removed.
