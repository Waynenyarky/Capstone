/**
 * Business Form Submission Integration Tests
 * Covers UC-2B-1, UC-2B-6, UC-2B-7, UC-2B-9 from Appendix K
 *
 * Tests the business registration submission and status flow.
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

  // Connect the business-service's own mongoose (it has its own node_modules/mongoose)
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.connect(uri);

  const businessService = require("../../../services/business-service/src/index");
  app = businessService.app;
});

afterAll(async () => {
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

let ownerToken, ownerId;

async function setupUsers() {
  const bcrypt = require("bcryptjs");
  const ts = Date.now();

  const ownerRole = await Role.findOneAndUpdate(
    { slug: "business_owner" },
    { name: "Business Owner", slug: "business_owner" },
    { upsert: true, new: true },
  );

  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "BizForm",
    email: `owner_bizform_${ts}@test.com`,
    phoneNumber: `__unset__bizform_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;
}

describe("Business Form Submission (2B)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await BusinessProfile.deleteMany({});
  });

  // ── Submit Application ──

  describe("POST /business-registration/:businessId/submit", () => {
    it("UC-2B-1: should submit business application", async () => {
      const bizId = `BIZ-${Date.now()}`;
      await BusinessProfile.create({
        userId: ownerId,
        businesses: [
          {
            businessId: bizId,
            businessName: "Test Business",
            businessRegistrationNumber: "BRN-001",
            isPrimary: true,
            businessStatus: "active",
            applicationStatus: "bir_registered",
            applicationType: "new",
            organizationType: "sole_proprietorship",
          },
        ],
      });

      const res = await request(app)
        .post(`/api/business/business-registration/${bizId}/submit`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("submitted");
      expect(res.body.referenceNumber).toBeDefined();
      expect(res.body.submittedAt).toBeDefined();
    });

    it("should handle non-existent business", async () => {
      const res = await request(app)
        .post("/api/business/business-registration/NONEXISTENT/submit")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
    });

    it("should handle user with no profile", async () => {
      const res = await request(app)
        .post("/api/business/business-registration/BIZ-NONE/submit")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Get Application Status ──

  describe("GET /business-registration/:businessId/status", () => {
    it("should return application status", async () => {
      const bizId = `BIZ-${Date.now()}`;
      await BusinessProfile.create({
        userId: ownerId,
        businesses: [
          {
            businessId: bizId,
            businessName: "Test Business",
            businessRegistrationNumber: "BRN-001",
            isPrimary: true,
            applicationStatus: "bir_registered",
            applicationReferenceNumber: "REF-001",
            submittedAt: new Date(),
          },
        ],
      });

      const res = await request(app)
        .get(`/api/business/business-registration/${bizId}/status`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
    });

    it("should handle non-existent business", async () => {
      const res = await request(app)
        .get("/api/business/business-registration/NONEXISTENT/status")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Draft Handling ──

  describe("UC-2B-6: Draft persistence", () => {
    it("should allow creating draft business and later submitting", async () => {
      const bizId = `BIZ-DRAFT-${Date.now()}`;
      await BusinessProfile.create({
        userId: ownerId,
        businesses: [
          {
            businessId: bizId,
            businessName: "Draft Business",
            businessRegistrationNumber: "BRN-001",
            isPrimary: true,
            businessStatus: "active",
            applicationStatus: "draft",
          },
        ],
      });

      // Verify draft exists
      const profile = await BusinessProfile.findOne({ userId: ownerId });
      expect(profile.businesses[0].applicationStatus).toBe("draft");

      // Simulate user completing BIR/agencies registration step
      const biz = profile.businesses.find((b) => b.businessId === bizId);
      biz.applicationStatus = "bir_registered";
      profile.markModified("businesses");
      await profile.save();

      // Submit the application
      const res = await request(app)
        .post(`/api/business/business-registration/${bizId}/submit`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("submitted");
    });
  });

  // ── Multiple Businesses ──

  describe("Multiple businesses per user", () => {
    it("should submit specific business without affecting others", async () => {
      const bizId1 = `BIZ-${Date.now()}-A`;
      const bizId2 = `BIZ-${Date.now()}-B`;

      await BusinessProfile.create({
        userId: ownerId,
        businesses: [
          {
            businessId: bizId1,
            businessName: "Business A",
            businessRegistrationNumber: "BRN-001",
            isPrimary: true,
            applicationStatus: "bir_registered",
          },
          {
            businessId: bizId2,
            businessName: "Business B",
            businessRegistrationNumber: "BRN-002",
            applicationStatus: "draft",
          },
        ],
      });

      // Submit only business A (which is bir_registered)
      const res = await request(app)
        .post(`/api/business/business-registration/${bizId1}/submit`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);

      // Verify business B is still draft
      const profile = await BusinessProfile.findOne({ userId: ownerId });
      const bizB = profile.businesses.find((b) => b.businessId === bizId2);
      expect(bizB.applicationStatus).toBe("draft");
    });
  });

  // ── Authorization ──

  describe("Authorization", () => {
    it("should require authentication for submit", async () => {
      const res = await request(app).post(
        "/api/business/business-registration/BIZ-1/submit",
      );

      expect(res.status).toBe(401);
    });

    it("should require authentication for status", async () => {
      const res = await request(app).get(
        "/api/business/business-registration/BIZ-1/status",
      );

      expect(res.status).toBe(401);
    });
  });
});
