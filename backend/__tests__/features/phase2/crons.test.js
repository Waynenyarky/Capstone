/**
 * Cron Job Unit Tests
 * Covers UC-2E-1, UC-2E-5 (renewalAutoFlag) and UC-2M-1 through UC-2M-9 (abandonedDetection)
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // Connect business-service's mongoose (BusinessProfile uses it)
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.connect(uri);
});

afterAll(async () => {
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.disconnect();
  await mongoServer.stop();
});

const BusinessProfile = require("../../../services/business-service/src/models/BusinessProfile");
const {
  flagBusinessesForRenewal,
  calculateMonthlyInterest,
} = require("../../../services/business-service/src/cron/renewalAutoFlag");
const {
  detectAbandonedBusinesses,
  markBusinessAbandoned,
} = require("../../../services/business-service/src/cron/abandonedDetection");

// ── Helpers ──
async function createProfile(businesses = []) {
  return BusinessProfile.create({
    userId: new mongoose.Types.ObjectId(),
    businesses: businesses.map((b, i) => ({
      businessId: `BIZ-${Date.now()}-${i}`,
      businessName: `Test Business ${i}`,
      businessRegistrationNumber: `BRN-${Date.now()}-${i}`,
      isPrimary: i === 0,
      businessStatus: "active",
      retirementStatus: "",
      renewals: [],
      ...b,
    })),
  });
}

describe("Renewal Auto-Flag Cron (2E)", () => {
  beforeEach(async () => {
    await BusinessProfile.deleteMany({});
  });

  describe("UC-2E-1: Flag businesses for renewal", () => {
    it("should flag active businesses that have no renewal for current year", async () => {
      await createProfile([{ businessName: "Active Biz" }]);

      const result = await flagBusinessesForRenewal();
      expect(result.flagged).toBe(1);
      expect(result.year).toBe(new Date().getFullYear());

      // Verify renewal was created
      const profile = await BusinessProfile.findOne({});
      expect(profile.businesses[0].renewals).toHaveLength(1);
      expect(profile.businesses[0].renewals[0].renewalStatus).toBe("draft");
    });
  });

  describe("UC-2E-5: Skip already renewed businesses", () => {
    it("should not flag businesses that already have a renewal for current year", async () => {
      const currentYear = new Date().getFullYear();
      await createProfile([
        {
          businessName: "Already Renewed",
          renewals: [
            {
              renewalId: `RNW-${currentYear}-existing`,
              renewalYear: currentYear,
              renewalStatus: "submitted",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ]);

      const result = await flagBusinessesForRenewal();
      expect(result.flagged).toBe(0);
    });
  });

  it("should skip inactive businesses", async () => {
    await createProfile([
      { businessName: "Inactive", businessStatus: "inactive" },
    ]);

    const result = await flagBusinessesForRenewal();
    expect(result.flagged).toBe(0);
  });

  it("should skip closed businesses", async () => {
    await createProfile([{ businessName: "Closed", businessStatus: "closed" }]);

    const result = await flagBusinessesForRenewal();
    expect(result.flagged).toBe(0);
  });

  it("should flag multiple businesses across profiles", async () => {
    await createProfile([{ businessName: "Biz A" }]);
    await createProfile([{ businessName: "Biz B" }, { businessName: "Biz C" }]);

    const result = await flagBusinessesForRenewal();
    expect(result.flagged).toBe(3);
  });
});

describe("Abandoned Business Detection Cron (2M)", () => {
  beforeEach(async () => {
    await BusinessProfile.deleteMany({});
  });

  // Save and restore the Date mock
  const RealDate = Date;

  afterEach(() => {
    global.Date = RealDate;
  });

  function mockDate(month) {
    // Mock Date to return a specific month (0-indexed)
    const year = 2025;
    const MockDate = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(year, month, 15);
        } else {
          super(...args);
        }
      }
      static now() {
        return new RealDate(year, month, 15).getTime();
      }
    };
    global.Date = MockDate;
  }

  describe("UC-2M-1: Detect businesses not renewed after grace period", () => {
    it("should detect abandoned businesses after March", async () => {
      mockDate(3); // April (month 3, 0-indexed)
      await createProfile([{ businessName: "No Renewal Biz" }]);

      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(1);
      expect(result.businesses[0].businessName).toBe("No Renewal Biz");
    });
  });

  describe("Grace period", () => {
    it("should skip detection during grace period (Jan-Mar)", async () => {
      mockDate(1); // February
      await createProfile([{ businessName: "Too Early" }]);

      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(0);
      expect(result.reason).toBe("within_grace_period");
    });
  });

  describe("UC-2M-5: Business renewed on Jan 31 — not flagged", () => {
    it("should not flag businesses with submitted renewal", async () => {
      mockDate(3); // April
      const currentYear = 2025;
      await createProfile([
        {
          businessName: "Renewed Late",
          renewals: [
            {
              renewalId: `RNW-${currentYear}-late`,
              renewalYear: currentYear,
              renewalStatus: "submitted",
              createdAt: new RealDate(),
              updatedAt: new RealDate(),
            },
          ],
        },
      ]);

      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(0);
    });
  });

  describe("UC-2M-6: Exclude retirement pending", () => {
    it("should exclude businesses with retirement requested", async () => {
      mockDate(3); // April
      await createProfile([
        {
          businessName: "Retiring",
          retirementStatus: "requested",
        },
      ]);

      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(0);
    });

    it("should exclude businesses with retirement confirmed", async () => {
      mockDate(3); // April
      await createProfile([
        {
          businessName: "Retired",
          retirementStatus: "confirmed",
        },
      ]);

      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(0);
    });
  });

  describe("UC-2M-7: Exclude renewal draft/submitted", () => {
    it("should flag businesses with only draft renewal (not submitted)", async () => {
      mockDate(3); // April
      const currentYear = 2025;
      await createProfile([
        {
          businessName: "Draft Only",
          renewals: [
            {
              renewalId: `RNW-${currentYear}-draft`,
              renewalYear: currentYear,
              renewalStatus: "draft",
              createdAt: new RealDate(),
              updatedAt: new RealDate(),
            },
          ],
        },
      ]);

      // Draft renewals are NOT excluded — only submitted/approved
      const result = await detectAbandonedBusinesses();
      expect(result.flagged).toBe(1);
    });
  });

  describe("markBusinessAbandoned", () => {
    it("should mark business as inactive", async () => {
      const profile = await createProfile([{ businessName: "To Abandon" }]);
      const bizId = profile.businesses[0].businessId;

      const result = await markBusinessAbandoned(bizId, "inspector-123");
      expect(result.status).toBe("inactive");

      const updated = await BusinessProfile.findById(profile._id);
      expect(updated.businesses[0].businessStatus).toBe("inactive");
    });

    it("should throw for non-existent business", async () => {
      await expect(
        markBusinessAbandoned("NONEXISTENT", "inspector-123"),
      ).rejects.toThrow("Business not found");
    });
  });
});
