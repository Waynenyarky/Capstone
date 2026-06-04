/**
 * Seed Fee Configuration
 *
 * Populates the FeeConfiguration collection from the City of General Trias
 * Citizen's Charter — OCBPLO 2025 (Mayor's Permit Fee on Business, Section 4A.01).
 *
 * Reference (source of truth):
 *   https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf
 *
 * Structure:
 *   - taxCode = Charter category number (1–12), e.g. "1" = Heavy Industries, "6" = Food Industries.
 *   - lineOfBusiness = sentence-only description (no tax code in text), e.g. "Canteens, Eateries, Food Stands, Bakeries, Catering Services - Less than 8 sq.m."
 *
 * Upsert key: (taxCode, lineOfBusiness). The script is idempotent.
 *
 * Usage:
 *   node backend/services/business-service/src/seed/seedFeeConfiguration.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
dotenv.config({
  path: path.resolve(__dirname, "..", "..", "..", "..", ".env"),
});

const FeeConfiguration = require("../models/FeeConfiguration");

// Charter Section 4A.01 — tax codes 1–12 (Mayor's Permit categories)
const CHARTER_TAX_CODES = [
  { code: "1", label: "Heavy Industries" },
  { code: "2", label: "Medium Industries" },
  { code: "3", label: "Institutional Establishments" },
  { code: "4", label: "Public Market Stalls" },
  { code: "5", label: "Rentals" },
  { code: "6", label: "Food Industries" },
  { code: "7", label: "Banks and Other Financial Institutions" },
  { code: "8", label: "Agricultural" },
  { code: "9", label: "Contractor" },
  { code: "10", label: "Amusement Places" },
  { code: "11", label: "Services" },
  { code: "12", label: "Trading/Retail/Wholesale" },
];

const BRACKETS = {
  retail: {
    kind: "tiered",
    brackets: [
      { min: 0, max: 400000, rate: 2.2 },
      { min: 400001, max: null, rate: 1.1 },
    ],
  },
  wholesale: {
    kind: "rate",
    brackets: [
      { min: 0, max: 1000000, rate: 1.0 },
      { min: 1000001, max: 2000000, rate: 0.75 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  manufacturer: {
    kind: "rate",
    brackets: [
      { min: 0, max: 500000, rate: 1.1 },
      { min: 500001, max: 2000000, rate: 0.88 },
      { min: 2000001, max: 6500000, rate: 0.66 },
      { min: 6500001, max: null, rate: 0.45 },
    ],
  },
  contractor: {
    kind: "rate",
    brackets: [
      { min: 0, max: 500000, rate: 1.5 },
      { min: 500001, max: 2000000, rate: 1.0 },
      { min: 2000001, max: null, rate: 0.6 },
    ],
  },
  bank: { kind: "rate", brackets: [{ min: 0, max: null, rate: 0.6 }] },
  peddler: { kind: "rate", brackets: [{ min: 0, max: null, rate: 0 }] },
};

const TAX_CAT = {
  a: "Annex 1 (a) — Manufacturers",
  b: "Annex 1 (b) — Wholesalers/Distributors",
  d: "Annex 1 (d) — Retailers",
  e: "Annex 1 (e) — Contractors",
  f: "Annex 1 (f) — Banks/Financial",
  g: "Annex 1 (g) — Peddlers",
  h: "Annex 1 (h) — Other (2.2% / 1.1%)",
};

function entry(
  taxCode,
  lineOfBusiness,
  mayorsPermitFee,
  businessTaxCategory,
  bracketKey,
  environmentalProtectionFee = null,
  barangayClearanceFee = null,
) {
  const { kind, brackets } = BRACKETS[bracketKey] || BRACKETS.retail;
  return {
    taxCode: String(taxCode),
    lineOfBusiness,
    mayorsPermitFee,
    ...(environmentalProtectionFee != null && { environmentalProtectionFee }),
    ...(barangayClearanceFee != null && { barangayClearanceFee }),
    businessTaxCategory,
    bracketKind: kind,
    brackets,
  };
}

// Mayor's Permit Fee table from Charter Section 4A.01 — line of business as sentence only (no tax code in text)
const SEED_DATA = [
  // (1) Heavy Industries
  entry("1", "Tannery", 12000, TAX_CAT.a, "manufacturer", 9000),
  entry("1", "Chemical Manufacturing", 12000, TAX_CAT.a, "manufacturer", 9000),
  entry("1", "Electronics", 12000, TAX_CAT.a, "manufacturer", 6000),
  entry(
    "1",
    "Plastic/Vinyl Manufacturing",
    12000,
    TAX_CAT.a,
    "manufacturer",
    6000,
  ),
  entry("1", "Aluminum Fabrication", 12000, TAX_CAT.a, "manufacturer", 4800),
  entry("1", "Bulb Manufacturing", 12000, TAX_CAT.a, "manufacturer", 4800),
  entry("1", "Rubber/Dye/Paint", 12000, TAX_CAT.a, "manufacturer", 4200),
  entry("1", "Food Processing", 12000, TAX_CAT.a, "manufacturer", 6000),
  entry("1", "Food Manufacturing", 12000, TAX_CAT.a, "manufacturer", 3600),

  // (2) Medium Industries
  entry("2", "Bottle Processing", 9000, TAX_CAT.a, "manufacturer", 2000),
  entry("2", "Concrete Products", 9000, TAX_CAT.a, "manufacturer"),
  entry(
    "2",
    "Gas/Chemical/Refilling Plant",
    9000,
    TAX_CAT.a,
    "manufacturer",
    3600,
  ),
  entry("2", "Paper Products", 9000, TAX_CAT.a, "manufacturer"),
  entry("2", "Refinery", 9000, TAX_CAT.a, "manufacturer", 2000),
  entry("2", "Metal Fabrication", 9000, TAX_CAT.a, "manufacturer"),

  // (3) Institutional Establishments
  entry(
    "3",
    "Dental/Optical/Veterinary/Other Clinics",
    1440,
    TAX_CAT.h,
    "retail",
  ),
  entry("3", "Hospitals", 3600, TAX_CAT.h, "retail"),
  entry("3", "Lying-In Clinics", 1800, TAX_CAT.h, "retail"),
  entry(
    "3",
    "Private Schools (non-stock & non-profit) - Less than 100 enrollees",
    2200,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "3",
    "Private Schools (non-stock & non-profit) - 100 to 499 enrollees",
    3000,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "3",
    "Private Schools (non-stock & non-profit) - 500 or more enrollees",
    3600,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "3",
    "Private Schools (taxable) - Less than 100 enrollees",
    1200,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "3",
    "Private Schools (taxable) - 100 to 499 enrollees",
    1800,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "3",
    "Private Schools (taxable) - 500 or more enrollees",
    2200,
    TAX_CAT.h,
    "retail",
  ),

  // (4) Public Market Stalls
  entry("4", "Wet Section/Tiles", 1440, TAX_CAT.d, "retail"),
  entry(
    "4",
    "Grocery: Dry goods & others - Small (5-6 sq.m.)",
    1200,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "4",
    "Grocery: Dry goods & others - Medium (7-11 sq.m.)",
    1320,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "4",
    "Grocery: Dry goods & others - Big (12-12.5 sq.m.)",
    1440,
    TAX_CAT.d,
    "retail",
  ),

  // (5) Rentals
  entry(
    "5",
    "Apartments/Boarding Houses - 8 rooms below",
    1200,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "5",
    "Apartments/Boarding Houses - 8 rooms above",
    1800,
    TAX_CAT.h,
    "retail",
  ),
  entry("5", "Car Rentals", 1800, TAX_CAT.h, "retail"),
  entry("5", "Commercial Spaces - Below 50 sq.m.", 1440, TAX_CAT.h, "retail"),
  entry("5", "Commercial Spaces - Above 50 sq.m.", 3600, TAX_CAT.h, "retail"),
  entry("5", "Real Estate Lessor/Realty", 1800, TAX_CAT.h, "retail"),
  entry(
    "5",
    "Video CD/Tape Rentals, Chairs/Tables Rentals",
    1200,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "5",
    "Computer Center, Internet Café and Similar Activities - Less than 10 computers",
    1440,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "5",
    "Computer Center, Internet Café and Similar Activities - 10 computers above",
    1800,
    TAX_CAT.h,
    "retail",
  ),

  // (6) Food Industries
  entry(
    "6",
    "Canteens, Eateries, Food Stands, Bakeries, Catering Services - Less than 8 sq.m.",
    600,
    TAX_CAT.h,
    "retail",
  ),
  entry(
    "6",
    "Canteens, Eateries, Food Stands, Bakeries, Catering Services - Above 8 sq.m.",
    1200,
    TAX_CAT.h,
    "retail",
  ),
  entry("6", "Restaurants - Less than 50 sq.m.", 1800, TAX_CAT.h, "retail"),
  entry("6", "Restaurants - Above 50 sq.m.", 3600, TAX_CAT.h, "retail"),
  entry("6", "Canteen Concessionaires", 2400, TAX_CAT.h, "retail"),
  entry("6", "Food Manufacturing (small scale)", 1800, TAX_CAT.h, "retail"),
  entry(
    "6",
    "Other food and catering related establishments",
    1200,
    TAX_CAT.h,
    "retail",
  ),

  // (7) Banks and Other Financial Institutions
  entry("7", "Bank", 6000, TAX_CAT.f, "bank"),
  entry("7", "Money Shops, Insurance Agencies", 2400, TAX_CAT.f, "bank"),
  entry(
    "7",
    "Pawnshop, Lending Investor, Investment Company",
    2400,
    TAX_CAT.f,
    "bank",
  ),
  entry("7", "Payment Center", 1440, TAX_CAT.f, "bank"),

  // (8) Agricultural
  entry(
    "8",
    "Agri-supply/Poultry Feeds/Veterinary Supply/Flower Shop",
    1200,
    TAX_CAT.d,
    "retail",
  ),
  entry("8", "Poultry Farms/Piggery/Fish Pen", 1800, TAX_CAT.d, "retail"),
  entry("8", "Rice Mill", 1200, TAX_CAT.d, "retail"),
  entry(
    "8",
    "Other farming and agricultural related establishments",
    1800,
    TAX_CAT.d,
    "retail",
  ),

  // (9) Contractor
  entry(
    "9",
    "Consultancy and other similar offices",
    1200,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Advertising Shop/Sign/Artworks", 1200, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Beauty Parlor, Barber Shop, Massage/Fitness Center",
    1200,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Brokerage", 1800, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Electronics/Garments and other sub-contractor - Below 50 sq.m.",
    1800,
    TAX_CAT.e,
    "contractor",
  ),
  entry(
    "9",
    "Electronics/Garments and other sub-contractor - Above 50 sq.m.",
    3600,
    TAX_CAT.e,
    "contractor",
  ),
  entry(
    "9",
    "Mechanical, Electrical, Electronic Repair Shop, Plumbing, Smith",
    1440,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Funeral Services", 2400, TAX_CAT.e, "contractor"),
  entry("9", "Furniture Shop/Woodworks", 1440, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "General Engineering/general Building",
    1800,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Heavy Equipment Contractor", 2400, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Machine Shop, Vulcanizing, Welding Car Care Services",
    1200,
    TAX_CAT.e,
    "contractor",
  ),
  entry(
    "9",
    "Manpower/Security Agency, General Services",
    1440,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Parking Lot", 1800, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Photo Studio, Printing Press and Tarpaulin Shops",
    1200,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Private Cemetery/Memorial Park", 6000, TAX_CAT.h, "retail"),
  entry("9", "Privately-Owned Market", 6000, TAX_CAT.d, "retail"),
  entry(
    "9",
    "Subdivision Operators/Developers, Real Estate Developers",
    12000,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Scrapper", 2400, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Tailoring, Dress Shop, Shoe Repair Shop, Upholstery, Laundry",
    1200,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Vehicle Construction", 1440, TAX_CAT.e, "contractor"),
  entry("9", "Vehicle Repair Shop/Services", 1440, TAX_CAT.e, "contractor"),
  entry(
    "9",
    "Warehousing/Forwarding Establishment",
    2400,
    TAX_CAT.e,
    "contractor",
  ),
  entry("9", "Other Contractor not Classified", 1200, TAX_CAT.e, "contractor"),
  entry("9", "Small Contractors", 600, TAX_CAT.e, "contractor"),

  // (10) Amusement Places
  entry("10", "Billiard Hall", 1200, TAX_CAT.h, "retail"),
  entry(
    "10",
    "Disco House, Beer House, Videoke Bar, Night Clubs",
    1800,
    TAX_CAT.h,
    "retail",
  ),
  entry("10", "Firing Range", 1800, TAX_CAT.h, "retail"),
  entry("10", "Golf Courses", 6000, TAX_CAT.h, "retail"),
  entry("10", "Movie Houses", 3600, TAX_CAT.h, "retail"),
  entry("10", "Resort, Swimming Pool", 1800, TAX_CAT.h, "retail"),
  entry("10", "Lottery/Bingo Hall", 2400, TAX_CAT.h, "retail"),
  entry("10", "Cockpit Arena", 6000, TAX_CAT.h, "retail"),
  entry("10", "Other amusement places", 2400, TAX_CAT.h, "retail"),

  // (11) Services
  entry("11", "Cable TV Services", 1800, TAX_CAT.h, "retail"),
  entry("11", "Gasoline Station", 3600, TAX_CAT.h, "retail"),
  entry("11", "Hotels/Motels", 6000, TAX_CAT.h, "retail"),
  entry("11", "Internet Service Provider", 1800, TAX_CAT.h, "retail"),
  entry(
    "11",
    "Telecommunications, Tower, Cell Site",
    6000,
    TAX_CAT.h,
    "retail",
  ),
  entry("11", "Telephone Service", 2400, TAX_CAT.h, "retail"),
  entry("11", "Water System/District", 6000, TAX_CAT.h, "retail"),
  entry("11", "Others", 1440, TAX_CAT.h, "retail"),

  // (12) Trading/Retail/Wholesale
  entry("12", "Appliance Center - Below 40 sq.m.", 1800, TAX_CAT.d, "retail"),
  entry("12", "Appliance Center - Above 40 sq.m.", 3600, TAX_CAT.d, "retail"),
  entry("12", "Auto/Motorcycle Parts", 1800, TAX_CAT.d, "retail"),
  entry("12", "Beer/Softdrinks Dealer", 1440, TAX_CAT.d, "retail"),
  entry("12", "Cell Phone Center", 1200, TAX_CAT.d, "retail"),
  entry("12", "Department Store (Retails/Lessor)", 6000, TAX_CAT.d, "retail"),
  entry(
    "12",
    "Drug Store/Pharmacy - Below 40 sq.m.",
    1200,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "12",
    "Drug Store/Pharmacy - Above 40 sq.m.",
    2400,
    TAX_CAT.d,
    "retail",
  ),
  entry("12", "Electronic/Electrical Store", 1200, TAX_CAT.d, "retail"),
  entry("12", "Furniture Retailing", 1800, TAX_CAT.d, "retail"),
  entry(
    "12",
    "General Merchandise, Grocery, Sari-Sari Store - below 5 sq.m.",
    300,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "12",
    "General Merchandise, Grocery, Sari-Sari Store - 5-9 sq.m.",
    600,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "12",
    "General Merchandise, Grocery, Sari-Sari Store - above 10 sq.m.",
    1200,
    TAX_CAT.d,
    "retail",
  ),
  entry("12", "Gift Shop/RTW/Shoes/Bags/Garments", 1200, TAX_CAT.d, "retail"),
  entry("12", "Jewelry/Watch Retailing", 1200, TAX_CAT.d, "retail"),
  entry("12", "Pet Shops and Accessories", 1200, TAX_CAT.d, "retail"),
  entry("12", "Supermarket", 6000, TAX_CAT.d, "retail"),
  entry("12", "Wine Store", 1440, TAX_CAT.d, "retail"),
  entry("12", "Water Refilling Station", 1800, TAX_CAT.d, "retail"),
  entry("12", "Junk Shop", 1440, TAX_CAT.d, "retail"),
  entry("12", "Ceramics/Bathroom Fixtures", 1800, TAX_CAT.d, "retail"),
  entry("12", "Glass, Aluminum, Iron Works", 1800, TAX_CAT.d, "retail"),
  entry("12", "Hardware, Construction Supplies", 1800, TAX_CAT.d, "retail"),
  entry("12", "Hollow Blocks Maker", 1800, TAX_CAT.d, "retail"),
  entry("12", "Marble Works/Baluster and the like", 1200, TAX_CAT.d, "retail"),
  entry("12", "Ready Mixed Concrete", 1500, TAX_CAT.d, "retail"),
  entry(
    "12",
    "Other Retail/Dealer/Supply - Below 40 sq.m.",
    1200,
    TAX_CAT.d,
    "retail",
  ),
  entry(
    "12",
    "Other Retail/Dealer/Supply - Above 40 sq.m.",
    2400,
    TAX_CAT.d,
    "retail",
  ),
  entry("12", "Cooperative", 600, TAX_CAT.d, "retail"),
  entry("12", "Association/Club", 600, TAX_CAT.d, "retail"),
  entry("12", "Peddler", 360, TAX_CAT.g, "peddler"),
];

async function seed() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/bplo";
  console.log(
    `Connecting to MongoDB: ${mongoUri.replace(/\/\/[^@]+@/, "//<credentials>@")}`,
  );
  await mongoose.connect(mongoUri);

  let upserted = 0;
  let skipped = 0;

  for (const row of SEED_DATA) {
    const setOnInsert = {
      taxCode: row.taxCode,
      lineOfBusiness: row.lineOfBusiness,
      mayorsPermitFee: row.mayorsPermitFee,
      businessTaxCategory: row.businessTaxCategory,
      bracketKind: row.bracketKind || "rate",
      brackets: row.brackets,
      effectiveDate: new Date(),
      isActive: true,
    };
    if (row.environmentalProtectionFee != null)
      setOnInsert.environmentalProtectionFee = row.environmentalProtectionFee;
    const result = await FeeConfiguration.updateOne(
      {
        taxCode: row.taxCode,
        lineOfBusiness: row.lineOfBusiness,
        isActive: true,
      },
      { $setOnInsert: setOnInsert },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      upserted++;
      console.log(
        `  + Seeded: ${row.taxCode} — ${row.lineOfBusiness} (₱${row.mayorsPermitFee})`,
      );
    } else {
      skipped++;
      console.log(
        `  = Skipped (exists): ${row.taxCode} — ${row.lineOfBusiness}`,
      );
    }
  }

  console.log(`\nDone. Seeded: ${upserted}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

/**
 * Seed fee configuration if the collection is empty.
 * Safe to call during startup — assumes mongoose is already connected.
 *
 * @returns {{ seeded: boolean, count?: number, error?: string }}
 */
async function seedIfEmpty() {
  try {
    const existingCount = await FeeConfiguration.countDocuments({});
    if (existingCount > 0) {
      return { seeded: false, count: existingCount };
    }

    let upserted = 0;
    for (const row of SEED_DATA) {
      const setOnInsert = {
        taxCode: row.taxCode,
        lineOfBusiness: row.lineOfBusiness,
        mayorsPermitFee: row.mayorsPermitFee,
        businessTaxCategory: row.businessTaxCategory,
        bracketKind: row.bracketKind || "rate",
        brackets: row.brackets,
        effectiveDate: new Date(),
        isActive: true,
      };
      if (row.environmentalProtectionFee != null)
        setOnInsert.environmentalProtectionFee = row.environmentalProtectionFee;
      const result = await FeeConfiguration.updateOne(
        {
          taxCode: row.taxCode,
          lineOfBusiness: row.lineOfBusiness,
          isActive: true,
        },
        { $setOnInsert: setOnInsert },
        { upsert: true },
      );
      if (result.upsertedCount > 0) upserted++;
    }

    return { seeded: true, count: upserted };
  } catch (error) {
    return { seeded: false, error: error.message };
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed, seedIfEmpty, SEED_DATA, CHARTER_TAX_CODES };
