/**
 * Seed Fee Configuration
 *
 * Populates the FeeConfiguration collection from the City of General Trias
 * Citizen's Charter — OCBPLO 2025 (Mayor's Permit Fee on Business, Annex 1).
 *
 * Reference (source of truth):
 *   https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf
 *
 * Mayor's Permit fees below are taken directly from the charter tables (Section 4A.01).
 * Business tax brackets approximate Annex 1: (a) manufacturers, (b) wholesalers,
 * (d) retailers 2.2% / 1.1%, (e) contractors, (f) banks 60% of 1%, (h) other.
 * Note: The charter uses fixed tax-per-annum for some brackets (manufacturers,
 * wholesalers); this seeder uses percentage rates for compatibility with the
 * current fee calculator (single rate applied to gross sales).
 *
 * Charter also defines: Sanitary Inspection Fee, Environmental Protection Fee,
 * Barangay Business Clearance, Fire Safety Inspection Fee (15% of BPLO fees, min P500),
 * Community Tax, Weights and Measures — not stored in FeeConfiguration.
 *
 * Usage:
 *   node backend/services/business-service/src/seed/seedFeeConfiguration.js
 *
 * The script is idempotent — it upserts by lineOfBusiness so re-running is safe.
 */

const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') })

const FeeConfiguration = require('../models/FeeConfiguration')

// Shared brackets from Annex 1 (Charter) — reused across LOBs
const BRACKETS = {
  retail: { kind: 'tiered', brackets: [{ min: 0, max: 400000, rate: 2.2 }, { min: 400001, max: null, rate: 1.1 }] },
  wholesale: { kind: 'rate', brackets: [{ min: 0, max: 1000000, rate: 1.0 }, { min: 1000001, max: 2000000, rate: 0.75 }, { min: 2000001, max: null, rate: 0.6 }] },
  manufacturer: { kind: 'rate', brackets: [{ min: 0, max: 500000, rate: 1.1 }, { min: 500001, max: 2000000, rate: 0.88 }, { min: 2000001, max: 6500000, rate: 0.66 }, { min: 6500001, max: null, rate: 0.45 }] },
  contractor: { kind: 'rate', brackets: [{ min: 0, max: 500000, rate: 1.5 }, { min: 500001, max: 2000000, rate: 1.0 }, { min: 2000001, max: null, rate: 0.6 }] },
  bank: { kind: 'rate', brackets: [{ min: 0, max: null, rate: 0.6 }] },
  peddler: { kind: 'rate', brackets: [{ min: 0, max: null, rate: 0 }] },
}

/** Charter Annex 1 (OCBPLO 2025) business tax categories — must match admin dropdown. */
const TAX_CAT = {
  a: 'Annex 1 (a) — Manufacturers',
  b: 'Annex 1 (b) — Wholesalers/Distributors',
  c: 'Annex 1 (c) — Exporters / Essential commodities',
  d: 'Annex 1 (d) — Retailers',
  e: 'Annex 1 (e) — Contractors',
  f: 'Annex 1 (f) — Banks/Financial',
  g: 'Annex 1 (g) — Peddlers',
  h: 'Annex 1 (h) — Other (2.2% / 1.1%)',
  i: 'Annex 1 (i) — Public utility vehicles',
}

function entry(taxCode, lineOfBusiness, mayorsPermitFee, businessTaxCategory, bracketKey, environmentalProtectionFee = null) {
  const { kind, brackets } = BRACKETS[bracketKey] || BRACKETS.retail
  return {
    taxCode,
    lineOfBusiness,
    mayorsPermitFee,
    ...(environmentalProtectionFee != null && { environmentalProtectionFee }),
    businessTaxCategory,
    bracketKind: kind,
    brackets,
  }
}

// From Citizen's Charter OCBPLO 2025 — Mayor's Permit Fee (Section 4A.01) and Annex 1 business tax.
// Full list: every distinct line of business in the charter table.
const SEED_DATA = [
  // —— Retail / Trading (Charter: General Merchandise, Grocery, Sari-Sari — above 10 sq.m. 1,200; below 5 sq.m. 300; 5–9 sq.m. 600)
  {
    taxCode: 'RET',
    lineOfBusiness: 'retail',
    mayorsPermitFee: 1200,
    businessTaxCategory: TAX_CAT.d,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'SRI',
    lineOfBusiness: 'sari_sari_store',
    mayorsPermitFee: 600,
    businessTaxCategory: TAX_CAT.d,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Wholesale (Charter: various; 2M+ at 60% of 1%)
  {
    taxCode: 'WHL',
    lineOfBusiness: 'wholesale',
    mayorsPermitFee: 1798,
    businessTaxCategory: TAX_CAT.b,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 1000000, rate: 1.0 },
      { min: 1000001, max: 2000000, rate: 0.75 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  // —— Food (Charter: Canteens <8 sq.m. 600, >8 sq.m. 1,200; Restaurants <50 sq.m. 1,800, >50 sq.m. 3,600)
  {
    taxCode: 'FDS',
    lineOfBusiness: 'food_service',
    mayorsPermitFee: 600,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'RES',
    lineOfBusiness: 'restaurant',
    mayorsPermitFee: 1800,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Manufacturing (Charter: Heavy 12,000; Medium 9,000; 6.5M+ at 45% of 1%)
  {
    taxCode: 'MFG',
    lineOfBusiness: 'manufacturing',
    mayorsPermitFee: 12000,
    businessTaxCategory: TAX_CAT.a,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 500000, rate: 1.1 },
      { min: 500001, max: 2000000, rate: 0.88 },
      { min: 2000001, max: 6500000, rate: 0.66 },
      { min: 6500001, max: null, rate: 0.45 },
    ],
  },
  {
    taxCode: 'MHI',
    lineOfBusiness: 'heavy_industry',
    mayorsPermitFee: 12000,
    businessTaxCategory: TAX_CAT.a,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 6500000, rate: 0.66 },
      { min: 6500001, max: null, rate: 0.45 },
    ],
  },
  {
    taxCode: 'MMI',
    lineOfBusiness: 'medium_industry',
    mayorsPermitFee: 9000,
    businessTaxCategory: TAX_CAT.a,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 6500000, rate: 0.66 },
      { min: 6500001, max: null, rate: 0.45 },
    ],
  },
  // —— Services (Charter: Others 1,440; Cable 1,800; Gasoline 3,600; Hotels 6,000; Telecom/Water 6,000)
  {
    taxCode: 'SVC',
    lineOfBusiness: 'services',
    mayorsPermitFee: 1440,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'GAS',
    lineOfBusiness: 'gasoline_station',
    mayorsPermitFee: 3600,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'HTL',
    lineOfBusiness: 'hotel_motel',
    mayorsPermitFee: 6000,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'TEL',
    lineOfBusiness: 'telecommunications',
    mayorsPermitFee: 6000,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Financial (Charter: Bank 6,000; Pawnshop/Money Shops 2,400; Payment Center 1,440)
  {
    taxCode: 'FIN',
    lineOfBusiness: 'financial',
    mayorsPermitFee: 6000,
    businessTaxCategory: TAX_CAT.f,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: null, rate: 0.6 },
    ],
  },
  {
    taxCode: 'PWN',
    lineOfBusiness: 'pawnshop',
    mayorsPermitFee: 2400,
    businessTaxCategory: TAX_CAT.f,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: null, rate: 0.6 },
    ],
  },
  // —— Real estate / Rentals (Charter: Real Estate Lessor 1,800; Commercial <50 sq.m. 1,440, >50 3,600)
  {
    taxCode: 'REL',
    lineOfBusiness: 'real_estate',
    mayorsPermitFee: 1800,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Contractors (Charter: General Engineering 1,800; Heavy Equipment 2,400; Subdivision 12,000; 2M+ min 13,915, 60% of 1%)
  {
    taxCode: 'CON',
    lineOfBusiness: 'construction',
    mayorsPermitFee: 1800,
    businessTaxCategory: TAX_CAT.e,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 500000, rate: 1.5 },
      { min: 500001, max: 2000000, rate: 1.0 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  {
    taxCode: 'TRN',
    lineOfBusiness: 'transportation',
    mayorsPermitFee: 1800,
    businessTaxCategory: TAX_CAT.e,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 500000, rate: 1.5 },
      { min: 500001, max: 2000000, rate: 1.0 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  // —— Agricultural (Charter: Agri-supply 1,200; Poultry/Piggery 1,800; Rice Mill 1,200)
  {
    taxCode: 'AGR',
    lineOfBusiness: 'agriculture',
    mayorsPermitFee: 1200,
    businessTaxCategory: TAX_CAT.d,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Institutional (Charter: Hospitals 3,600; Clinics 1,440; Private Schools 1,200–3,600)
  {
    taxCode: 'HOS',
    lineOfBusiness: 'hospital',
    mayorsPermitFee: 3600,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  {
    taxCode: 'CLN',
    lineOfBusiness: 'clinic',
    mayorsPermitFee: 1440,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Amusement (Charter: Billiard 1,200; Disco/Beer 1,800; Golf 6,000; Cockpit 6,000)
  {
    taxCode: 'AMU',
    lineOfBusiness: 'amusement',
    mayorsPermitFee: 1800,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Utilities / Water (Charter: Water System/District 6,000)
  {
    taxCode: 'UTL',
    lineOfBusiness: 'utilities',
    mayorsPermitFee: 6000,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'tiered',
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  // —— Mining (charter: permits depend on activity; placeholder)
  {
    taxCode: 'MIN',
    lineOfBusiness: 'mining',
    mayorsPermitFee: 3600,
    businessTaxCategory: TAX_CAT.h,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: 500000, rate: 1.5 },
      { min: 500001, max: 2000000, rate: 1.0 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  // —— Peddler (Charter: Php360 Mayor's Permit, P55 peddler tax annually)
  {
    taxCode: 'PED',
    lineOfBusiness: 'peddler',
    mayorsPermitFee: 360,
    businessTaxCategory: TAX_CAT.g,
    bracketKind: 'rate',
    brackets: [
      { min: 0, max: null, rate: 0 },
    ],
  },

  // ——— Charter Section 4A.01 expanded — every distinct LOB in the charter ———

  // (1) Heavy Industries — Charter Php12,000; Section 4W.01 Environmental Fee
  entry('TAN', 'tannery', 12000, TAX_CAT.a, 'manufacturer', 9000),
  entry('CHM', 'chemical_manufacturing', 12000, TAX_CAT.a, 'manufacturer', 9000),
  entry('ELX', 'electronics_heavy', 12000, TAX_CAT.a, 'manufacturer', 6000),
  entry('PVN', 'plastic_vinyl_manufacturing', 12000, TAX_CAT.a, 'manufacturer', 6000),
  entry('ALF', 'aluminum_fabrication', 12000, TAX_CAT.a, 'manufacturer', 4800),
  entry('BLB', 'bulb_manufacturing', 12000, TAX_CAT.a, 'manufacturer', 4800),
  entry('RDP', 'rubber_dye_paint', 12000, TAX_CAT.a, 'manufacturer', 4200),
  entry('FPR', 'food_processing', 12000, TAX_CAT.a, 'manufacturer', 6000),
  entry('FMF', 'food_manufacturing', 12000, TAX_CAT.a, 'manufacturer', 3600),

  // (2) Medium Industries — Charter Php9,000
  entry('BTP', 'bottle_processing', 9000, TAX_CAT.a, 'manufacturer', 2000),
  entry('CCP', 'concrete_products', 9000, TAX_CAT.a, 'manufacturer'),
  entry('GCR', 'gas_chemical_refilling_plant', 9000, TAX_CAT.a, 'manufacturer', 3600),
  entry('PAP', 'paper_products', 9000, TAX_CAT.a, 'manufacturer'),
  entry('REF', 'refinery', 9000, TAX_CAT.a, 'manufacturer', 2000),
  entry('MTF', 'metal_fabrication', 9000, TAX_CAT.a, 'manufacturer'),

  // (3) Institutional
  entry('DOV', 'dental_optical_veterinary_clinics', 1440, TAX_CAT.h, 'retail'),
  entry('LYN', 'lying_in_clinics', 1800, TAX_CAT.h, 'retail'),
  entry('PSN', 'private_school_nonprofit_small', 2200, TAX_CAT.h, 'retail'),
  entry('PSM', 'private_school_nonprofit_medium', 3000, TAX_CAT.h, 'retail'),
  entry('PSL', 'private_school_nonprofit_large', 3600, TAX_CAT.h, 'retail'),
  entry('PTS', 'private_school_taxable_small', 1200, TAX_CAT.h, 'retail'),
  entry('PTM', 'private_school_taxable_medium', 1800, TAX_CAT.h, 'retail'),
  entry('PTL', 'private_school_taxable_large', 2200, TAX_CAT.h, 'retail'),

  // (4) Public Market Stalls
  entry('WST', 'wet_section_tiles', 1440, TAX_CAT.d, 'retail'),
  entry('GRS', 'grocery_small', 1200, TAX_CAT.d, 'retail'),
  entry('GRM', 'grocery_medium', 1320, TAX_CAT.d, 'retail'),
  entry('GRB', 'grocery_big', 1440, TAX_CAT.d, 'retail'),

  // (5) Rentals
  entry('APB', 'apartments_8_below', 1200, TAX_CAT.h, 'retail'),
  entry('APA', 'apartments_8_above', 1800, TAX_CAT.h, 'retail'),
  entry('CRT', 'car_rentals', 1800, TAX_CAT.h, 'retail'),
  entry('CSB', 'commercial_space_below_50', 1440, TAX_CAT.h, 'retail'),
  entry('CSA', 'commercial_space_above_50', 3600, TAX_CAT.h, 'retail'),
  entry('VDR', 'video_rentals', 1200, TAX_CAT.h, 'retail'),
  entry('CCC', 'computer_center_under_10', 1440, TAX_CAT.h, 'retail'),
  entry('CCA', 'computer_center_10_above', 1800, TAX_CAT.h, 'retail'),

  // (6) Food Industries
  entry('CNU', 'canteen_under_8', 600, TAX_CAT.h, 'retail'),
  entry('CNA', 'canteen_above_8', 1200, TAX_CAT.h, 'retail'),
  entry('RSU', 'restaurant_under_50', 1800, TAX_CAT.h, 'retail'),
  entry('RSA', 'restaurant_above_50', 3600, TAX_CAT.h, 'retail'),
  entry('CNC', 'canteen_concessionaires', 2400, TAX_CAT.h, 'retail'),
  entry('FMS', 'food_manufacturing_small_scale', 1800, TAX_CAT.h, 'retail'),
  entry('OFC', 'other_food_catering', 1200, TAX_CAT.h, 'retail'),

  // (7) Banks and Financial
  entry('MSI', 'money_shops_insurance', 2400, TAX_CAT.f, 'bank'),
  entry('PTC', 'payment_center', 1440, TAX_CAT.f, 'bank'),

  // (8) Agricultural
  entry('APF', 'agri_supply_poultry_feeds', 1200, TAX_CAT.d, 'retail'),
  entry('PPF', 'poultry_piggery_fish_pen', 1800, TAX_CAT.d, 'retail'),
  entry('RCM', 'rice_mill', 1200, TAX_CAT.d, 'retail'),
  entry('OFA', 'other_farming_agricultural', 1800, TAX_CAT.d, 'retail'),

  // (9) Contractors
  entry('CYC', 'consultancy', 1200, TAX_CAT.e, 'contractor'),
  entry('ADS', 'advertising_shop', 1200, TAX_CAT.e, 'contractor'),
  entry('BPM', 'beauty_parlor_barber_massage', 1200, TAX_CAT.e, 'contractor'),
  entry('BRK', 'brokerage', 1800, TAX_CAT.e, 'contractor'),
  entry('EGU', 'electronics_garments_subcontractor_under_50', 1800, TAX_CAT.e, 'contractor'),
  entry('EGA', 'electronics_garments_subcontractor_above_50', 3600, TAX_CAT.e, 'contractor'),
  entry('MER', 'mechanical_electrical_repair', 1440, TAX_CAT.e, 'contractor'),
  entry('FNS', 'funeral_services', 2400, TAX_CAT.e, 'contractor'),
  entry('FSW', 'furniture_shop_woodworks', 1440, TAX_CAT.e, 'contractor'),
  entry('HEQ', 'heavy_equipment_contractor', 2400, TAX_CAT.e, 'contractor'),
  entry('MSV', 'machine_shop_vulcanizing', 1200, TAX_CAT.e, 'contractor'),
  entry('MPS', 'manpower_security_agency', 1440, TAX_CAT.e, 'contractor'),
  entry('PRK', 'parking_lot', 1800, TAX_CAT.e, 'contractor'),
  entry('PSP', 'photo_studio_printing', 1200, TAX_CAT.e, 'contractor'),
  entry('PCM', 'private_cemetery_memorial_park', 6000, TAX_CAT.h, 'retail'),
  entry('POM', 'privately_owned_market', 6000, TAX_CAT.d, 'retail'),
  entry('SOD', 'subdivision_operators_developers', 12000, TAX_CAT.e, 'contractor'),
  entry('SCR', 'scrapper', 2400, TAX_CAT.e, 'contractor'),
  entry('TDS', 'tailoring_dress_shoe_repair', 1200, TAX_CAT.e, 'contractor'),
  entry('VCS', 'vehicle_construction', 1440, TAX_CAT.e, 'contractor'),
  entry('VRS', 'vehicle_repair_shop', 1440, TAX_CAT.e, 'contractor'),
  entry('WFS', 'warehousing_forwarding', 2400, TAX_CAT.e, 'contractor'),
  entry('OCC', 'other_contractor', 1200, TAX_CAT.e, 'contractor'),
  entry('SMC', 'small_contractors', 600, TAX_CAT.e, 'contractor'),

  // (10) Amusement
  entry('BLH', 'billiard_hall', 1200, TAX_CAT.h, 'retail'),
  entry('DBV', 'disco_beer_videoke', 1800, TAX_CAT.h, 'retail'),
  entry('FRG', 'firing_range', 1800, TAX_CAT.h, 'retail'),
  entry('GLF', 'golf_courses', 6000, TAX_CAT.h, 'retail'),
  entry('MVH', 'movie_houses', 3600, TAX_CAT.h, 'retail'),
  entry('RSP', 'resort_swimming_pool', 1800, TAX_CAT.h, 'retail'),
  entry('LBH', 'lottery_bingo_hall', 2400, TAX_CAT.h, 'retail'),
  entry('CKA', 'cockpit_arena', 6000, TAX_CAT.h, 'retail'),
  entry('OAM', 'other_amusement', 2400, TAX_CAT.h, 'retail'),

  // (11) Services
  entry('CTV', 'cable_tv', 1800, TAX_CAT.h, 'retail'),
  entry('ISP', 'internet_service_provider', 1800, TAX_CAT.h, 'retail'),
  entry('TLS', 'telephone_service', 2400, TAX_CAT.h, 'retail'),

  // (12) Trading/Retail/Wholesale — additional granular LOBs
  entry('APU', 'appliance_center_under_40', 1800, TAX_CAT.d, 'retail'),
  entry('ACA', 'appliance_center_above_40', 3600, TAX_CAT.d, 'retail'),
  entry('AMP', 'auto_motorcycle_parts', 1800, TAX_CAT.d, 'retail'),
  entry('BSD', 'beer_softdrinks_dealer', 1440, TAX_CAT.d, 'retail'),
  entry('CPC', 'cell_phone_center', 1200, TAX_CAT.d, 'retail'),
  entry('DPS', 'department_store', 6000, TAX_CAT.d, 'retail'),
  entry('DRU', 'drug_store_under_40', 1200, TAX_CAT.d, 'retail'),
  entry('DRA', 'drug_store_above_40', 2400, TAX_CAT.d, 'retail'),
  entry('EES', 'electronic_electrical_store', 1200, TAX_CAT.d, 'retail'),
  entry('FUR', 'furniture_retailing', 1800, TAX_CAT.d, 'retail'),
  entry('GMB', 'general_merchandise_below_5', 300, TAX_CAT.d, 'retail'),
  entry('GM5', 'general_merchandise_5_9', 600, TAX_CAT.d, 'retail'),
  entry('GMA', 'general_merchandise_above_10', 1200, TAX_CAT.d, 'retail'),
  entry('GRT', 'gift_shop_rtw', 1200, TAX_CAT.d, 'retail'),
  entry('JWR', 'jewelry_watch_retailing', 1200, TAX_CAT.d, 'retail'),
  entry('PTS', 'pet_shops', 1200, TAX_CAT.d, 'retail'),
  entry('SMP', 'supermarket', 6000, TAX_CAT.d, 'retail'),
  entry('WNS', 'wine_store', 1440, TAX_CAT.d, 'retail'),
  entry('WRS', 'water_refilling_station', 1800, TAX_CAT.d, 'retail'),
  entry('JKS', 'junk_shop', 1440, TAX_CAT.d, 'retail'),
  entry('CBF', 'ceramics_bathroom_fixtures', 1800, TAX_CAT.d, 'retail'),
  entry('GAI', 'glass_aluminum_iron', 1800, TAX_CAT.d, 'retail'),
  entry('HCS', 'hardware_construction_supplies', 1800, TAX_CAT.d, 'retail'),
  entry('HBM', 'hollow_blocks_maker', 1800, TAX_CAT.d, 'retail'),
  entry('MRW', 'marble_works', 1200, TAX_CAT.d, 'retail'),
  entry('RMC', 'ready_mixed_concrete', 1500, TAX_CAT.d, 'retail'),
  entry('ORU', 'other_retail_under_40', 1200, TAX_CAT.d, 'retail'),
  entry('ORA', 'other_retail_above_40', 2400, TAX_CAT.d, 'retail'),
  entry('COP', 'cooperative', 600, TAX_CAT.d, 'retail'),
  entry('ASC', 'association_club', 600, TAX_CAT.d, 'retail'),
]

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bplo'
  console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/[^@]+@/, '//<credentials>@')}`)
  await mongoose.connect(mongoUri)

  let upserted = 0
  let skipped = 0

  for (const row of SEED_DATA) {
    const setOnInsert = {
      taxCode: row.taxCode,
      lineOfBusiness: row.lineOfBusiness,
      mayorsPermitFee: row.mayorsPermitFee,
      businessTaxCategory: row.businessTaxCategory,
      bracketKind: row.bracketKind || 'rate',
      brackets: row.brackets,
      effectiveDate: new Date(),
      isActive: true,
    }
    if (row.environmentalProtectionFee != null) setOnInsert.environmentalProtectionFee = row.environmentalProtectionFee
    const result = await FeeConfiguration.updateOne(
      { lineOfBusiness: row.lineOfBusiness, isActive: true },
      { $setOnInsert: setOnInsert },
      { upsert: true }
    )
    if (result.upsertedCount > 0) {
      upserted++
      console.log(`  + Seeded: ${row.taxCode} — ${row.lineOfBusiness} (₱${row.mayorsPermitFee})`)
    } else {
      skipped++
      console.log(`  = Skipped (exists): ${row.taxCode} — ${row.lineOfBusiness}`)
    }
  }

  console.log(`\nDone. Seeded: ${upserted}, Skipped: ${skipped}, Total: ${SEED_DATA.length}`)
  await mongoose.disconnect()
}

/**
 * Seed fee configuration if the collection is empty.
 * Safe to call during startup — assumes mongoose is already connected.
 * Used when Docker resets so the Fee Configuration admin page has data.
 *
 * @returns {{ seeded: boolean, count?: number, error?: string }}
 */
async function seedIfEmpty() {
  try {
    const existingCount = await FeeConfiguration.countDocuments({})
    if (existingCount > 0) {
      return { seeded: false, count: existingCount }
    }

    let upserted = 0
    for (const row of SEED_DATA) {
      const setOnInsert = {
        taxCode: row.taxCode,
        lineOfBusiness: row.lineOfBusiness,
        mayorsPermitFee: row.mayorsPermitFee,
        businessTaxCategory: row.businessTaxCategory,
        bracketKind: row.bracketKind || 'rate',
        brackets: row.brackets,
        effectiveDate: new Date(),
        isActive: true,
      }
      if (row.environmentalProtectionFee != null) setOnInsert.environmentalProtectionFee = row.environmentalProtectionFee
      const result = await FeeConfiguration.updateOne(
        { lineOfBusiness: row.lineOfBusiness, isActive: true },
        { $setOnInsert: setOnInsert },
        { upsert: true }
      )
      if (result.upsertedCount > 0) upserted++
    }

    return { seeded: true, count: upserted }
  } catch (error) {
    return { seeded: false, error: error.message }
  }
}

// Allow running standalone or importing SEED_DATA for tests
if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
}

module.exports = { SEED_DATA, seed, seedIfEmpty }
