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
| **Sanitary Inspection Fee** | Section 5E.01 (by area sq.m.) | `RegulatoryFeeConfig.sanitaryBrackets` + `sanitaryHouseForRentFee` — **Admin → Fee Configuration → Special fees → Sanitary Inspection Fee** |
| **Business Plate/Sticker** | Section 4A.01 | `RegulatoryFeeConfig.businessPlate` — **Special fees → Business Plate / Sticker** |
| **Environmental Protection Fee** | Section 4W.01 (by industry) | `FeeConfiguration.environmentalProtectionFee` — **Fee by Line of Business** (or view in Special fees → Environmental) |
| **Fire Safety Inspection Fee** | 15% of BPLO regulatory fees, min P500 | `RegulatoryFeeConfig.fireSafetyRate` + `fireSafetyMin` — **Special fees → Fire Safety Inspection Fee** |
| **Fee for Sealing and Licensing of Weights and Measures** | Section 4J.01 | `RegulatoryFeeConfig.weightsAndMeasures` — **Special fees → Weights and Measures** |
| **Community Tax** | Section 3.01–3.07 | `RegulatoryFeeConfig.communityTax` — **Special fees → Community Tax** |
| **Barangay Business Clearance** | Artikulo A (by line of business) | `FeeConfiguration.barangayClearanceFee` — **Fee by Line of Business** (or view in Special fees → Barangay Business Clearance) |
| **Special Permit** (Streamer, Motorcade) | Charter table | `RegulatoryFeeConfig.specialPermit` — **Special fees → Special Permit** |
| **Certification of Business Record** | Charter | `RegulatoryFeeConfig.certificationOfBusinessRecord` — **Special fees → Certification & Certified Copy** |
| **Certified True Copy of Business Permit** | Charter | `RegulatoryFeeConfig.certifiedTrueCopyPerDocument` — **Special fees → Certification & Certified Copy** |

## Seeder alignment

- **Mayor's Permit:** Values in `seedFeeConfiguration.js` are taken from the charter (e.g. retail 1,200; sari-sari 600; bank 6,000; heavy industry 12,000; gasoline 3,600; hotel 6,000).
- **Business tax:** The charter uses (1) **fixed tax per annum** for some brackets (e.g. manufacturers: “Less than 10,000 → P199.50”) and (2) **percentages** for others (e.g. retailers: 2.2% on first 400k, 1.1% on excess). Our `feeCalculator` only supports a single **percentage rate** applied to gross sales in a bracket. So:
  - Retailers: we use 2.2% for ≤400k and 1.1% for &gt;400k; true charter rule is 2.2% on first 400k + 1.1% on excess (tiered). Result may differ for &gt;400k.
  - Manufacturers/wholesalers: charter uses fixed amounts per bracket; we store percentage rates as an approximation.

## Where fees are declared

| Fee type | Where to change values |
|----------|------------------------|
| **Mayor's Permit** | Seeder or **Admin → Fee Configuration → Fee by Line of Business** — `mayorsPermitFee` per LOB. |
| **Business Tax** | Same seeder / **Fee by Line of Business** — `brackets` and `bracketKind`. |
| **Sanitary** | **Admin → Fee Configuration → Special fees** (left nav: Sanitary Inspection Fee) — brackets and house-for-rent fee. Stored in `RegulatoryFeeConfig`. |
| **Business Plate** | **Special fees → Business Plate / Sticker**. Stored in `RegulatoryFeeConfig.businessPlate`. |
| **Environmental** | **Fee by Line of Business** — per-LOB `environmentalProtectionFee`. View-only table in **Special fees → Environmental Protection Fee**. |
| **Fire Safety** | **Special fees → Fire Safety Inspection Fee** — rate and minimum. Stored in `RegulatoryFeeConfig`. |
| **Weights and Measures** | **Special fees → Weights and Measures** — linear, capacity, weights brackets and retesting/gasoline. Stored in `RegulatoryFeeConfig.weightsAndMeasures`. |
| **Community Tax** | **Special fees → Community Tax** — individual and juridical base, rate, cap. Stored in `RegulatoryFeeConfig.communityTax`. |
| **Barangay Clearance** | **Fee by Line of Business** — per-LOB `barangayClearanceFee`. View-only table in **Special fees → Barangay Business Clearance**. |
| **Special Permit** | **Special fees → Special Permit** — streamer (per sq yard, days) and motorcade per day. Stored in `RegulatoryFeeConfig.specialPermit`. |
| **Certification / Certified Copy** | **Special fees → Certification & Certified Copy** — fee and documentary stamp for each. Stored in `RegulatoryFeeConfig`. |

The **Special fees** tab uses a two-panel layout: left sidebar lists all Charter special fee types; right panel shows the selected type's form. **Environmental** and **Barangay** are edited in **Fee by Line of Business**; their panels in Special fees show a read-only table with a link to that tab.

## Where to change things

- **Add/change Mayor's Permit, Environmental, Barangay, or tax brackets:** Use **Admin → Fee Configuration → Fee by Line of Business** (or edit `seedFeeConfiguration.js` and re-run the seeder).
- **Change any other special fees (Sanitary, Fire Safety, Business Plate, Weights and Measures, Community Tax, Special Permit, Certification):** Use **Admin → Fee Configuration → Special fees** and select the fee type in the left sidebar. Values are stored in `RegulatoryFeeConfig` (singleton). To change defaults when no DB config exists, edit `backend/services/business-service/src/lib/feeCalculator.js` (DEFAULT_* for Sanitary/Fire Safety) or the `RegulatoryFeeConfig` model defaults.
- **Support tiered or fixed-amount tax:** Would require schema and `feeCalculator.js` changes (e.g. bracket type `fixedAmount` vs `rate`).
