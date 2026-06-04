/**
 * Retirement / Cessation Integration Tests
 * Covers UC-2F-1 through UC-2F-10 from Appendix K
 */

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer, app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect backend's default mongoose (used by Violation model in retirement route)
  await mongoose.connect(uri);
  // Connect the business-service's mongoose
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.connect(uri);

  const businessService = require("../../../services/business-service/src/index");
  app = businessService.app;
});

afterAll(async () => {
  await mongoose.disconnect();
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.disconnect();
  await mongoServer.stop();
});

const BusinessProfile = require("../../../services/business-service/src/models/BusinessProfile");
const User = require("../../../services/business-service/src/models/User");
const Role = require("../../../services/business-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/business-service/src/middleware/auth");

// ── Helpers ──
let ownerToken, staffToken, ownerId, staffId;

async function setupUsers() {
  const ownerRole = await Role.findOneAndUpdate(
    { slug: "business_owner" },
    { name: "Business Owner", slug: "business_owner" },
    { upsert: true, new: true },
  );
  const staffRole = await Role.findOneAndUpdate(
    { slug: "lgu_officer" },
    { name: "LGU Officer", slug: "lgu_officer" },
    { upsert: true, new: true },
  );

  const bcrypt = require("bcryptjs");
  const ts = Date.now();

  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "Test",
    email: `owner_retire_${ts}@test.com`,
    phoneNumber: `__unset__retire_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;

  const staff = await User.create({
    role: staffRole._id,
    firstName: "Staff",
    lastName: "Test",
    email: `staff_retire_${ts}@test.com`,
    phoneNumber: `__unset__retire_${ts}_s`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  });
  staffId = staff._id.toString();
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token;
}

async function createBusinessProfile(overrides = {}) {
  return BusinessProfile.create({
    userId: ownerId,
    businesses: [
      {
        businessId: `BIZ-${Date.now()}`,
        businessName: "Test Business",
        businessRegistrationNumber: `BRN-${Date.now()}`,
        isPrimary: true,
        businessStatus: "active",
        retirementStatus: "",
        ...overrides,
      },
    ],
  });
}

describe("Retirement / Cessation (2F)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await BusinessProfile.deleteMany({});
  });

  // ── Happy Paths ──

  describe("UC-2F-1: Owner submits retirement", () => {
    it("should submit retirement application successfully", async () => {
      const profile = await createBusinessProfile();
      const bizId = profile.businesses[0].businessId;

      const res = await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          applicationLetter: "I wish to retire my business.",
          swornStatementGrossSales: 500000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.retirementStatus).toBe("requested");
    });

    it("should submit retirement when business subdocument _id is used", async () => {
      const profile = await createBusinessProfile();
      const businessSubdocId = profile.businesses[0]._id.toString();

      const res = await request(app)
        .post(`/api/business/${businessSubdocId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          applicationLetter: "Retire via subdocument id",
          swornStatementGrossSales: 12345,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.retirementStatus).toBe("requested");
    });
  });

  describe("UC-2F-1: Full retirement flow", () => {
    it("should complete: requested → inspector_verified → confirmed", async () => {
      const profile = await createBusinessProfile();
      const bizId = profile.businesses[0].businessId;

      // Step 1: Owner submits
      await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          applicationLetter: "Retiring",
          swornStatementGrossSales: 100000,
        });

      // Step 2: Inspector verifies closed
      const verifyRes = await request(app)
        .post(`/api/business/${bizId}/retire/verify`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ verified: true });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.retirementStatus).toBe("inspector_verified");

      // Step 3: Officer confirms
      const confirmRes = await request(app)
        .post(`/api/business/${bizId}/retire/confirm`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.retirementStatus).toBe("confirmed");
      expect(confirmRes.body.data.businessStatus).toBe("closed");
    });

    it("should review cessation when business subdocument _id is used", async () => {
      const profile = await createBusinessProfile({
        retirementStatus: "requested",
      });
      const businessSubdocId = profile.businesses[0]._id.toString();

      const reviewRes = await request(app)
        .put(`/api/business/retirements/${businessSubdocId}/review`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "confirmed", reviewNotes: "Validated closure" });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.application.retirementStatus).toBe("confirmed");
    });
  });

  // ── Edge Cases ──

  describe("UC-2F-8: Duplicate retirement submission", () => {
    it("should reject RETIREMENT_ALREADY_PENDING", async () => {
      const profile = await createBusinessProfile({
        retirementStatus: "requested",
      });
      const bizId = profile.businesses[0].businessId;

      const res = await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Again", swornStatementGrossSales: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("RETIREMENT_ALREADY_PENDING");
    });

    it("should reject if already confirmed", async () => {
      const profile = await createBusinessProfile({
        retirementStatus: "confirmed",
      });
      const bizId = profile.businesses[0].businessId;

      const res = await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Again", swornStatementGrossSales: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("RETIREMENT_ALREADY_PENDING");
    });

    it("should reject if inspector_verified", async () => {
      const profile = await createBusinessProfile({
        retirementStatus: "inspector_verified",
      });
      const bizId = profile.businesses[0].businessId;

      const res = await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Again", swornStatementGrossSales: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("RETIREMENT_ALREADY_PENDING");
    });
  });

  describe("UC-2F-7: Inspector reports still operating", () => {
    it("should reject retirement when inspector says not closed", async () => {
      const profile = await createBusinessProfile();
      const bizId = profile.businesses[0].businessId;

      // Submit retirement
      await request(app)
        .post(`/api/business/${bizId}/retire`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Retiring", swornStatementGrossSales: 0 });

      // Inspector rejects
      const res = await request(app)
        .post(`/api/business/${bizId}/retire/verify`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          verified: false,
          rejectionReason: "Business is still operating",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.retirementStatus).toBe("rejected");
    });
  });

  describe("UC-2F-3: Officer rejects retirement", () => {
    it("should not confirm if not inspector_verified", async () => {
      const profile = await createBusinessProfile({
        retirementStatus: "requested",
      });
      const bizId = profile.businesses[0].businessId;

      const res = await request(app)
        .post(`/api/business/${bizId}/retire/confirm`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_STATE");
    });
  });

  describe("Not found cases", () => {
    it("should return 404 for non-existent profile", async () => {
      const res = await request(app)
        .post("/api/business/NONEXISTENT/retire")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Test", swornStatementGrossSales: 0 });

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent business in profile", async () => {
      await createBusinessProfile();

      const res = await request(app)
        .post("/api/business/WRONG-BIZ-ID/retire")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ applicationLetter: "Test", swornStatementGrossSales: 0 });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /retirements — list", () => {
    it("should list retirement applications", async () => {
      await createBusinessProfile({
        retirementStatus: "requested",
        retirementRequestedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/business/retirements")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].retirementStatus).toBe("requested");
    });

    it("should filter by status", async () => {
      await createBusinessProfile({
        retirementStatus: "requested",
        retirementRequestedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/business/retirements?status=confirmed")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      // No confirmed retirements
      expect(res.body.data.length).toBe(0);
    });
  });
});
