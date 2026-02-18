# General Trias Citizen's Charter (OCBPLO 2025) — Fee Reference

This doc summarizes how the [Citizen's Charter PDF](https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf) maps into our fee configuration seeder and calculator.

## Source

- **Document:** City of General Trias — City Business Permit and Licensing Office (CBPLO) Citizen's Charter 2025  
- **URL:** https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf  

## What the charter defines

| Fee type | Charter section | In our system |
|----------|-----------------|----------------|
| **Mayor's Permit Fee on Business** | Section 4A.01 (table by line of business) | `FeeConfiguration.mayorsPermitFee` — seeder has all charter LOBs |
| **Business Tax** (manufacturers, wholesalers, retailers, contractors, banks, etc.) | Annex 1 (schedules) | `FeeConfiguration.brackets` — percentage approximation |
| **Sanitary Inspection Fee** | Section 5E.01 (by area sq.m.) | `feeCalculator.computeSanitaryFee(areaSqm)` — brackets in code |
| **Environmental Protection Fee** | Section 4W.01 (by industry) | `FeeConfiguration.environmentalProtectionFee` + `computeEnvironmentalFee(lob)` |
| **Fire Safety Inspection Fee** | 15% of BPLO regulatory fees, min P500 | `feeCalculator.computeFireSafetyFee(bploRegulatory)` |
| Barangay Business Clearance | Artikulo A (by line of business) | Not in FeeConfiguration |
| Community Tax | Section 3.x | Not in FeeConfiguration |
| Weights and Measures | Section 4J.01 | Not in FeeConfiguration |

## Seeder alignment

- **Mayor's Permit:** Values in `seedFeeConfiguration.js` are taken from the charter (e.g. retail 1,200; sari-sari 600; bank 6,000; heavy industry 12,000; gasoline 3,600; hotel 6,000).
- **Business tax:** The charter uses (1) **fixed tax per annum** for some brackets (e.g. manufacturers: “Less than 10,000 → P199.50”) and (2) **percentages** for others (e.g. retailers: 2.2% on first 400k, 1.1% on excess). Our `feeCalculator` only supports a single **percentage rate** applied to gross sales in a bracket. So:
  - Retailers: we use 2.2% for ≤400k and 1.1% for &gt;400k; true charter rule is 2.2% on first 400k + 1.1% on excess (tiered). Result may differ for &gt;400k.
  - Manufacturers/wholesalers: charter uses fixed amounts per bracket; we store percentage rates as an approximation.

## Where fees are declared

| Fee type | Where to change values |
|----------|------------------------|
| **Mayor's Permit** | `backend/services/business-service/src/seed/seedFeeConfiguration.js` — each LOB entry has `mayorsPermitFee` (and optional `environmentalProtectionFee`). Re-run the seeder or use **Admin → Fee Configuration → Fee by Line of Business** to update. |
| **Business Tax** | Same seeder / **Admin → Fee Configuration → Fee by Line of Business** — `BRACKETS` and per-entry `brackets` / `bracketKind`. |
| **Environmental (special)** | Seeder or **Fee by Line of Business** (per-LOB `environmentalProtectionFee`). Schema: `FeeConfiguration.environmentalProtectionFee`. |
| **Sanitary (special)** | **Admin → Fee Configuration → Special fees** — edit Sanitary brackets (area sq.m. → fee) and house-for-rent fee. Stored in `RegulatoryFeeConfig` (DB). Defaults in `feeCalculator.js` if no config exists. |
| **Fire Safety (special)** | **Admin → Fee Configuration → Special fees** — edit rate (e.g. 0.15 = 15%) and minimum (₱). Stored in `RegulatoryFeeConfig` (DB). Defaults in `feeCalculator.js` if no config exists. |

So: **Mayor's Permit, Business Tax, Environmental** are edited per LOB in Fee Configuration. **Sanitary** and **Fire Safety** are edited in the **Special fees** tab; values are stored in the database and used by the fee calculator.

## Where to change things

- **Add/change Mayor's Permit or tax brackets:** Edit `backend/services/business-service/src/seed/seedFeeConfiguration.js` and keep charter section references in comments.
- **Change Sanitary brackets or Fire Safety rate/min:** Use **Admin → Fee Configuration → Special fees** in the app. To change defaults when no DB config exists, edit `backend/services/business-service/src/lib/feeCalculator.js` (DEFAULT_* constants).
- **Support tiered or fixed-amount tax:** Would require schema and `feeCalculator.js` changes (e.g. bracket type `fixedAmount` vs `rate`).
