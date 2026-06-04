/**
 * Line of Business Taxonomy & PSIC Code Mappings
 *
 * Placeholder data based on General Trias, Cavite business classifications.
 * Each entry maps a tax code to a line-of-business category with detailed
 * sub-lines and corresponding PSIC 2019 codes.
 *
 * These values must stay in sync with:
 * - Fee configuration schedules
 * - Business permit application forms
 */

const LINE_OF_BUSINESS = [
  {
    taxCode: "RET",
    lineOfBusiness: "retail",
    detailedLines: [
      "Sari-sari store",
      "Convenience store",
      "General merchandise",
      "Hardware & construction supplies",
      "Pharmacy / drugstore",
      "Clothing & apparel",
      "Electronics & gadgets",
      "Auto parts & accessories",
      "Fuel / gasoline station",
      "Agricultural supplies",
    ],
    psicCodes: [
      "4711",
      "4719",
      "4721",
      "4730",
      "4741",
      "4751",
      "4752",
      "4761",
      "4773",
      "4789",
    ],
  },
  {
    taxCode: "WHL",
    lineOfBusiness: "wholesale",
    detailedLines: [
      "Agricultural raw materials",
      "Food & beverages (wholesale)",
      "Household goods (wholesale)",
      "Industrial machinery & equipment",
      "Construction materials (wholesale)",
      "Chemicals & fertilizers",
    ],
    psicCodes: ["4610", "4620", "4631", "4632", "4641", "4649"],
  },
  {
    taxCode: "FDS",
    lineOfBusiness: "food_service",
    detailedLines: [
      "Restaurant / eatery",
      "Catering services",
      "Food cart / food stall",
      "Bakery / pastry shop",
      "Coffee shop / milk tea",
      "Bar / nightclub",
      "Canteen / commissary",
    ],
    psicCodes: ["5610", "5621", "5629", "5630"],
  },
  {
    taxCode: "MFG",
    lineOfBusiness: "manufacturing",
    detailedLines: [
      "Food processing",
      "Garments & textiles",
      "Furniture & woodworks",
      "Metal fabrication",
      "Plastics & rubber products",
      "Printing & publishing",
      "Chemical products",
      "Electronics assembly",
      "Fireworks / pyrotechnics",
    ],
    psicCodes: [
      "1010",
      "1020",
      "1040",
      "1311",
      "1410",
      "1621",
      "2211",
      "2220",
      "1811",
      "2610",
      "2040",
    ],
  },
  {
    taxCode: "SVC",
    lineOfBusiness: "services",
    detailedLines: [
      "Salon / barbershop",
      "Laundry services",
      "Repair shop (electronics, appliances)",
      "Tutorial / review center",
      "IT / BPO services",
      "Legal services",
      "Accounting / bookkeeping",
      "Medical / dental clinic",
      "Veterinary clinic",
      "Security agency",
      "Manpower / recruitment agency",
      "Advertising services",
    ],
    psicCodes: [
      "9602",
      "9601",
      "9521",
      "8549",
      "6201",
      "6910",
      "6920",
      "8610",
      "7500",
      "8010",
      "7810",
      "7310",
    ],
  },
  {
    taxCode: "FIN",
    lineOfBusiness: "financial",
    detailedLines: [
      "Lending / financing company",
      "Pawnshop",
      "Money changer / remittance",
      "Insurance agency",
      "Cooperative (credit)",
      "Microfinance institution",
    ],
    psicCodes: ["6419", "6492", "6612", "6511", "6430", "6492"],
  },
  {
    taxCode: "RES",
    lineOfBusiness: "real_estate",
    detailedLines: [
      "Real estate brokerage",
      "Property leasing / rental",
      "Subdivision developer",
      "Boarding house / dormitory",
      "Apartment / condominium rental",
    ],
    psicCodes: ["6810", "6820", "4100", "5510", "5510"],
  },
  {
    taxCode: "TRN",
    lineOfBusiness: "transportation",
    detailedLines: [
      "Trucking / hauling",
      "Passenger transport (jeepney, bus, UV express)",
      "Delivery / courier service",
      "Freight forwarding",
      "Warehouse / storage",
      "Parking lot operation",
    ],
    psicCodes: ["4923", "4922", "5320", "5229", "5210", "5221"],
  },
  {
    taxCode: "AGR",
    lineOfBusiness: "agriculture",
    detailedLines: [
      "Crop farming",
      "Livestock / poultry raising",
      "Aquaculture / fishpond",
      "Plant nursery",
      "Rice / corn milling",
      "Agricultural services (spraying, harvesting)",
    ],
    psicCodes: ["0111", "0141", "0321", "0130", "1061", "0161"],
  },
  {
    taxCode: "CON",
    lineOfBusiness: "construction",
    detailedLines: [
      "General contractor",
      "Specialty trade contractor",
      "Electrical installation",
      "Plumbing & HVAC",
      "Painting & finishing",
      "Demolition services",
    ],
    psicCodes: ["4100", "4290", "4321", "4322", "4330", "4311"],
  },
  {
    taxCode: "MIN",
    lineOfBusiness: "mining",
    detailedLines: [
      "Sand & gravel quarrying",
      "Stone quarrying",
      "Non-metallic mineral mining",
    ],
    psicCodes: ["0810", "0810", "0899"],
  },
  {
    taxCode: "UTL",
    lineOfBusiness: "utilities",
    detailedLines: [
      "Water distribution",
      "Electric power distribution",
      "Waste collection & disposal",
      "Sewerage services",
    ],
    psicCodes: ["3600", "3510", "3811", "3700"],
  },
];

// Extract unique category keys for enum validation
const LINE_OF_BUSINESS_CATEGORIES = LINE_OF_BUSINESS.map(
  (l) => l.lineOfBusiness,
);

// Quick lookup by taxCode
const LINE_OF_BUSINESS_BY_TAX_CODE = Object.fromEntries(
  LINE_OF_BUSINESS.map((l) => [l.taxCode, l]),
);

// Quick lookup by category
const LINE_OF_BUSINESS_BY_CATEGORY = Object.fromEntries(
  LINE_OF_BUSINESS.map((l) => [l.lineOfBusiness, l]),
);

module.exports = {
  LINE_OF_BUSINESS,
  LINE_OF_BUSINESS_CATEGORIES,
  LINE_OF_BUSINESS_BY_TAX_CODE,
  LINE_OF_BUSINESS_BY_CATEGORY,
};
