/**
 * Fee Calculator Unit Tests
 * Covers UC-2C-1 through UC-2C-9 from Appendix K
 *
 * Tests computeBusinessTax, computeMayorsPermitFee, computeApplicationFees,
 * computePenalty, and validateActivities.
 */

const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// We need a real MongoDB connection because feeCalculator reads from FeeConfiguration model.
// The business-service has its own node_modules/mongoose, so we must connect *that* instance.
const FeeConfiguration = require("../../../services/business-service/src/models/FeeConfiguration");
const bsMongoose = FeeConfiguration.base;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await bsMongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await bsMongoose.disconnect();
  await mongoServer.stop();
});
const {
  getFeeConfig,
  computeMayorsPermitFee,
  computeBusinessTax,
  computeApplicationFees,
  computePenalty,
  validateActivities,
} = require("../../../services/business-service/src/lib/feeCalculator");

describe("Fee Calculator", () => {
  beforeEach(async () => {
    await FeeConfiguration.deleteMany({});
  });

  // ── Seed helper ──
  async function seedFeeConfig(overrides = {}) {
    return FeeConfiguration.create({
      lineOfBusiness: "retail",
      mayorsPermitFee: 500,
      businessTaxCategory: "A",
      bracketKind: "rate", // default for legacy tests
      brackets: [
        { min: 0, max: 100000, rate: 0.5 },
        { min: 100001, max: 400000, rate: 1 },
        { min: 400001, max: null, rate: 1.5 }, // top bracket — no upper limit
      ],
      effectiveDate: new Date(),
      isActive: true,
      ...overrides,
    });
  }

  // ────────────────────────────────────────────────
  // getFeeConfig
  // ────────────────────────────────────────────────
  describe("getFeeConfig", () => {
    it("returns config for existing line of business", async () => {
      await seedFeeConfig();
      const config = await getFeeConfig("retail");
      expect(config).not.toBeNull();
      expect(config.lineOfBusiness).toBe("retail");
    });

    it("returns null for non-existent line of business", async () => {
      const config = await getFeeConfig("nonexistent");
      expect(config).toBeNull();
    });

    it("returns null for empty string", async () => {
      const config = await getFeeConfig("");
      expect(config).toBeNull();
    });

    it("returns null for null/undefined", async () => {
      expect(await getFeeConfig(null)).toBeNull();
      expect(await getFeeConfig(undefined)).toBeNull();
    });

    it("is case-insensitive and trims whitespace", async () => {
      await seedFeeConfig();
      const config = await getFeeConfig("  RETAIL  ");
      expect(config).not.toBeNull();
    });

    it("only returns active configs", async () => {
      await seedFeeConfig({ isActive: false });
      const config = await getFeeConfig("retail");
      expect(config).toBeNull();
    });
  });

  // ────────────────────────────────────────────────
  // computeMayorsPermitFee
  // ────────────────────────────────────────────────
  describe("computeMayorsPermitFee", () => {
    it("UC-2C-2: returns correct mayor permit fee", async () => {
      await seedFeeConfig({ mayorsPermitFee: 500 });
      const fee = await computeMayorsPermitFee("retail");
      expect(fee).toBe(500);
    });

    it("UC-2C-4: returns 0 when no config exists (FEE_CONFIG_MISSING)", async () => {
      const fee = await computeMayorsPermitFee("unknown_business");
      expect(fee).toBe(0);
    });

    it("returns 0 when mayorsPermitFee is 0", async () => {
      await seedFeeConfig({ mayorsPermitFee: 0 });
      const fee = await computeMayorsPermitFee("retail");
      expect(fee).toBe(0);
    });
  });

  // ────────────────────────────────────────────────
  // computeBusinessTax
  // ────────────────────────────────────────────────
  describe("computeBusinessTax", () => {
    beforeEach(async () => {
      await seedFeeConfig();
    });

    it("UC-2C-2: computes tax for gross sales in first bracket", async () => {
      // 50,000 * 0.5% = 250
      const tax = await computeBusinessTax("retail", 50000);
      expect(tax).toBe(250);
    });

    it("UC-2C-2: computes tax for gross sales in middle bracket", async () => {
      // 200,000 * 1% = 2000
      const tax = await computeBusinessTax("retail", 200000);
      expect(tax).toBe(2000);
    });

    it("UC-2C-3: handles bracket boundary exactly (400,000)", async () => {
      // 400,000 is in the second bracket (100001-400000), rate 1%
      const tax = await computeBusinessTax("retail", 400000);
      expect(tax).toBe(4000);
    });

    it("UC-2C-8: uses top bracket for gross sales exceeding max bracket", async () => {
      // 1,000,000 in top bracket (400001+), rate 1.5%
      const tax = await computeBusinessTax("retail", 1000000);
      expect(tax).toBe(15000);
    });

    it("UC-2C-7: handles gross sales = 0", async () => {
      const tax = await computeBusinessTax("retail", 0);
      expect(tax).toBe(0);
    });

    it("UC-2C-9: handles negative gross sales", async () => {
      const tax = await computeBusinessTax("retail", -5000);
      expect(tax).toBe(0);
    });

    it("UC-2C-4: returns 0 when no config exists", async () => {
      const tax = await computeBusinessTax("nonexistent", 100000);
      expect(tax).toBe(0);
    });

    it("returns 0 when config has no brackets", async () => {
      await FeeConfiguration.deleteMany({});
      await seedFeeConfig({ brackets: [] });
      const tax = await computeBusinessTax("retail", 100000);
      expect(tax).toBe(0);
    });

    it("falls back to last bracket when no bracket matches", async () => {
      await FeeConfiguration.deleteMany({});
      await seedFeeConfig({
        brackets: [
          { min: 10000, max: 50000, rate: 1 },
          { min: 50001, max: 100000, rate: 2 },
        ],
      });
      // 5000 is below the first bracket min — should fall back to last bracket
      const tax = await computeBusinessTax("retail", 5000);
      // Falls back to last bracket rate (2%)
      expect(tax).toBe(100);
    });

    it("bracketKind tiered: applies rate per segment and sums", async () => {
      await FeeConfiguration.deleteMany({});
      await seedFeeConfig({
        lineOfBusiness: "retail_tiered",
        bracketKind: "tiered",
        brackets: [
          { min: 0, max: 400000, rate: 2.2 },
          { min: 400001, max: null, rate: 1.1 },
        ],
      });
      // 500,000: first 400k * 2.2% = 8800, next 100k * 1.1% = 1100, total 9900
      const tax = await computeBusinessTax("retail_tiered", 500000);
      expect(tax).toBeCloseTo(9900, 0);
    });

    it("bracketKind fixed: returns bracket amount when gross in [min, max]", async () => {
      await FeeConfiguration.deleteMany({});
      await seedFeeConfig({
        lineOfBusiness: "manufacturing_fixed",
        bracketKind: "fixed",
        brackets: [
          { min: 0, max: 9999, amount: 99.5 },
          { min: 10000, max: 49999, amount: 199.5 },
          { min: 50000, max: null, amount: 299.5 },
        ],
      });
      expect(await computeBusinessTax("manufacturing_fixed", 5000)).toBe(99.5);
      expect(await computeBusinessTax("manufacturing_fixed", 25000)).toBe(
        199.5,
      );
      expect(await computeBusinessTax("manufacturing_fixed", 100000)).toBe(
        299.5,
      );
    });
  });

  // ────────────────────────────────────────────────
  // validateActivities
  // ────────────────────────────────────────────────
  describe("validateActivities", () => {
    it("returns valid for correct activities", () => {
      const result = validateActivities([
        { lineOfBusiness: "retail", grossSales: 100000 },
      ]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid for empty array", () => {
      const result = validateActivities([]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("At least one business activity");
    });

    it("returns invalid for null/undefined", () => {
      expect(validateActivities(null).valid).toBe(false);
      expect(validateActivities(undefined).valid).toBe(false);
    });

    it("returns error for missing lineOfBusiness", () => {
      const result = validateActivities([{ grossSales: 100000 }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("lineOfBusiness is required");
    });

    it("UC-2C-9: returns error for negative grossSales", () => {
      const result = validateActivities([
        { lineOfBusiness: "retail", grossSales: -5000 },
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("cannot be negative");
    });

    it("validates multiple activities independently", () => {
      const result = validateActivities([
        { lineOfBusiness: "retail", grossSales: 100000 },
        { grossSales: -500 }, // missing LOB + negative
      ]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ────────────────────────────────────────────────
  // computeApplicationFees
  // ────────────────────────────────────────────────
  describe("computeApplicationFees", () => {
    beforeEach(async () => {
      await seedFeeConfig();
    });

    it("UC-2C-2: computes total fees for single activity", async () => {
      const result = await computeApplicationFees({
        businessActivities: [{ lineOfBusiness: "retail", grossSales: 200000 }],
      });
      // Mayor's permit: 500, Business tax: 200000 * 1% = 2000; Fire Safety (Charter): 15% of BPLO min P500 = 500
      expect(result.mayorsPermitFee).toBe(500);
      expect(result.businessTax).toBe(2000);
      expect(result.sanitaryFee).toBe(0);
      expect(result.environmentalFee).toBe(0);
      expect(result.fireSafetyFee).toBe(500);
      expect(result.total).toBe(3000);
      expect(result.breakdown).toHaveLength(1);
      expect(result.errors).toBeUndefined();
    });

    it("computes fees for multiple activities", async () => {
      await seedFeeConfig({
        lineOfBusiness: "food",
        mayorsPermitFee: 300,
        brackets: [{ min: 0, max: null, rate: 2 }],
      });
      const result = await computeApplicationFees({
        businessActivities: [
          { lineOfBusiness: "retail", grossSales: 200000 },
          { lineOfBusiness: "food", grossSales: 50000 },
        ],
      });
      // Retail: 500 + 2000 = 2500, Food: 300 + 1000 = 1300; BPLO = 3800; Fire Safety 15% = 570
      expect(result.total).toBe(4370);
      expect(result.fireSafetyFee).toBe(570);
      expect(result.breakdown).toHaveLength(2);
    });

    it("UC-2C-4: includes FEE_CONFIG_MISSING warning", async () => {
      const result = await computeApplicationFees({
        businessActivities: [{ lineOfBusiness: "unknown", grossSales: 100000 }],
      });
      expect(result.warnings).toBeDefined();
      expect(result.warnings[0]).toContain("FEE_CONFIG_MISSING");
      expect(result.breakdown[0].configFound).toBe(false);
    });

    it("returns errors for invalid activities", async () => {
      const result = await computeApplicationFees({
        businessActivities: [],
      });
      expect(result.errors).toBeDefined();
      expect(result.total).toBe(0);
    });

    it("UC-2C-7: handles 0 gross sales gracefully", async () => {
      const result = await computeApplicationFees({
        businessActivities: [{ lineOfBusiness: "retail", grossSales: 0 }],
      });
      expect(result.mayorsPermitFee).toBe(500);
      expect(result.businessTax).toBe(0);
      expect(result.fireSafetyFee).toBe(500);
      expect(result.total).toBe(1000);
    });
  });

  // ────────────────────────────────────────────────
  // computePenalty
  // ────────────────────────────────────────────────
  describe("computePenalty", () => {
    const defaultConfig = {
      surchargePercentage: 25,
      monthlyInterestRate: 2,
      penaltyStartDay: 20,
    };

    it("UC-2E-8: no penalty before deadline (Jan 19)", () => {
      const submissionDate = new Date(2025, 0, 19, 10, 0, 0); // Jan 19 10:00 AM
      const result = computePenalty(10000, submissionDate, defaultConfig);
      expect(result.surcharge).toBe(0);
      expect(result.interest).toBe(0);
      expect(result.totalPenalty).toBe(0);
      expect(result.monthsLate).toBe(0);
    });

    it("UC-2E-8: no penalty on deadline day before 11:59 PM (Jan 20)", () => {
      const submissionDate = new Date(2025, 0, 20, 10, 0, 0); // Jan 20 10:00 AM
      const result = computePenalty(10000, submissionDate, defaultConfig);
      // penaltyDate is Jan 20 23:59:59, submission is Jan 20 10:00 — should be no penalty
      expect(result.surcharge).toBe(0);
      expect(result.totalPenalty).toBe(0);
    });

    it("UC-2E-2: applies 25% surcharge after deadline", () => {
      const submissionDate = new Date(2025, 0, 21, 10, 0, 0); // Jan 21
      const result = computePenalty(10000, submissionDate, defaultConfig);
      expect(result.surcharge).toBe(2500); // 25% of 10000
    });

    it("UC-2E-2: applies monthly interest for months late", () => {
      const submissionDate = new Date(2025, 2, 15); // March 15
      const result = computePenalty(10000, submissionDate, defaultConfig);
      expect(result.surcharge).toBe(2500); // 25%
      // monthsLate = 2 (Feb, Mar)
      expect(result.monthsLate).toBe(2);
      // interest = (10000 + 2500) * 2% * 2 = 500
      expect(result.interest).toBe(500);
      expect(result.totalPenalty).toBe(3000);
    });

    it("handles custom penalty config", () => {
      const customConfig = {
        surchargePercentage: 30,
        monthlyInterestRate: 3,
        penaltyStartDay: 15,
      };
      const submissionDate = new Date(2025, 1, 20); // Feb 20
      const result = computePenalty(10000, submissionDate, customConfig);
      expect(result.surcharge).toBe(3000); // 30%
      expect(result.monthsLate).toBe(1); // February
    });

    it("handles 0 base fees", () => {
      const submissionDate = new Date(2025, 2, 15); // March
      const result = computePenalty(0, submissionDate, defaultConfig);
      expect(result.surcharge).toBe(0);
      expect(result.interest).toBe(0);
      expect(result.totalPenalty).toBe(0);
    });

    it("uses defaults when no config provided", () => {
      const submissionDate = new Date(2025, 0, 21); // Jan 21
      const result = computePenalty(10000, submissionDate, {});
      // Default: 25% surcharge, 2% monthly, day 20
      expect(result.surcharge).toBe(2500);
    });

    it("uses current date when no submission date provided", () => {
      const result = computePenalty(10000, null, defaultConfig);
      // Result depends on current date — just verify it returns a valid object
      expect(result).toHaveProperty("surcharge");
      expect(result).toHaveProperty("interest");
      expect(result).toHaveProperty("totalPenalty");
      expect(result).toHaveProperty("monthsLate");
    });
  });
});
