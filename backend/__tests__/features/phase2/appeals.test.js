/**
 * Appeals Integration Tests
 * Covers UC-2K-1 through UC-2K-7 from Appendix K
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

const Appeal = require("../../../services/business-service/src/models/Appeal");
const BusinessProfile = require("../../../services/business-service/src/models/BusinessProfile");
const User = require("../../../services/business-service/src/models/User");
const Role = require("../../../services/business-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/business-service/src/middleware/auth");

let ownerToken, managerToken, ownerId, managerId;

async function setupUsers() {
  const bcrypt = require("bcryptjs");
  const ts = Date.now();

  const ownerRole = await Role.findOneAndUpdate(
    { slug: "business_owner" },
    { name: "Business Owner", slug: "business_owner" },
    { upsert: true, new: true },
  );
  const managerRole = await Role.findOneAndUpdate(
    { slug: "lgu_manager" },
    { name: "LGU Manager", slug: "lgu_manager" },
    { upsert: true, new: true },
  );

  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "Appeal",
    email: `owner_appeal_${ts}@test.com`,
    phoneNumber: `__unset__appeal_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;

  const manager = await User.create({
    role: managerRole._id,
    firstName: "Manager",
    lastName: "Appeal",
    email: `manager_appeal_${ts}@test.com`,
    phoneNumber: `__unset__appeal_${ts}_m`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  managerId = manager._id.toString();
  managerToken = signAccessToken({
    ...manager.toObject(),
    role: managerRole,
  }).token;
}

describe("Appeals (2K)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await Appeal.deleteMany({});
    await BusinessProfile.deleteMany({});
  });

  // ── Happy Paths ──

  describe("UC-2K-1: Owner submits appeal", () => {
    it("should create appeal with valid data", async () => {
      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "wrong_fees",
          description: "The fee assessment is incorrect for my business type.",
          evidence: ["receipt_001.pdf"],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("submitted");
      expect(res.body.data.appealType).toBe("wrong_fees");
      expect(res.body.data.requestedBy).toBe(ownerId);
    });
  });

  describe("UC-2K-3: Appeal references violation/inspection", () => {
    it("should store violationId and inspectionId", async () => {
      const violationId = new mongoose.Types.ObjectId().toString();
      const inspectionId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "wrong_violations",
          description: "The violation was incorrectly assigned.",
          violationId,
          inspectionId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.violationId).toBe(violationId);
      expect(res.body.data.inspectionId).toBe(inspectionId);
    });
  });

  describe("UC-2K-2: Manager resolves appeal", () => {
    it("should approve appeal with resolution", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "approved",
          resolution: "Fee has been corrected. Refund will be processed.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");
      expect(res.body.data.resolution).toBe(
        "Fee has been corrected. Refund will be processed.",
      );
      expect(res.body.data.reviewedBy).toBe(managerId);
      expect(res.body.data.resolvedAt).toBeDefined();
    });

    it("should reject appeal with resolution", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "rejected",
          resolution: "Fee assessment is correct per the current fee schedule.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("rejected");
    });

    it("should normalize upheld to approved", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "upheld",
          resolution: "Legacy UI alias should still resolve correctly.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");
      expect(res.body.data.reviewedBy).toBe(managerId);
    });

    it("should normalize overturned to rejected", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "overturned",
          resolution: "Legacy UI alias should still resolve correctly.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("rejected");
      expect(res.body.data.reviewedBy).toBe(managerId);
    });

    it("should move approved appealed business back to under_review", async () => {
      await BusinessProfile.create({
        userId: ownerId,
        businesses: [
          {
            businessId: "BIZ-001",
            businessName: "Appealed Business",
            businessRegistrationNumber: "DTI-APPEAL-001",
            applicationStatus: "rejected",
            hasActiveAppeal: true,
            appealId: "legacy-appeal-id",
            appealExhausted: true,
            rejectionReason: "Old rejection",
            reviewComments: "Needs correction",
          },
        ],
      });

      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          status: "approved",
          resolution: "Return this application for re-review.",
        });

      expect(res.status).toBe(200);

      const profile = await BusinessProfile.findOne({ userId: ownerId }).lean();
      const business = profile.businesses.find(
        (b) => b.businessId === "BIZ-001",
      );

      expect(business.applicationStatus).toBe("under_review");
      expect(business.hasActiveAppeal).toBe(false);
      expect(business.appealId).toBe("");
      expect(business.appealExhausted).toBe(false);
      expect(business.rejectionReason).toBe("");
      expect(business.reviewComments).toBe("");
    });
  });

  // ── Edge Cases ──

  describe("UC-2K-4: Duplicate appeal", () => {
    it("should reject DUPLICATE_APPEAL for same business/type", async () => {
      // Create existing open appeal
      await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "First appeal",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "wrong_fees",
          description: "Duplicate appeal",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE_APPEAL");
    });

    it("should allow appeal for different type on same business", async () => {
      await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Fee appeal",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "wrong_violations",
          description: "Violation appeal",
        });

      expect(res.status).toBe(201);
    });

    it("should allow appeal after previous one is resolved", async () => {
      await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Resolved appeal",
        requestedBy: ownerId,
        status: "rejected",
      });

      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "wrong_fees",
          description: "New appeal after rejection",
        });

      expect(res.status).toBe(201);
    });
  });

  describe("Cannot resolve already resolved appeal", () => {
    it("should reject update on approved appeal", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Already done",
        requestedBy: ownerId,
        status: "approved",
        resolvedAt: new Date(),
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "rejected", resolution: "Changed my mind" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ALREADY_RESOLVED");
    });
  });

  describe("Validation", () => {
    it("should require appealType and description", async () => {
      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ businessId: "BIZ-001" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should require businessId", async () => {
      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ appealType: "wrong_fees", description: "No business" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid appealType", async () => {
      const res = await request(app)
        .post("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          businessId: "BIZ-001",
          appealType: "invalid_type",
          description: "Bad type",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 for non-existent appeal", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/business/appeals/${fakeId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(404);
    });

    it("should reject invalid resolution status", async () => {
      const appeal = await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Incorrect fee",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/appeals/${appeal._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "not-a-real-status" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /appeals — list", () => {
    it("should list appeals", async () => {
      await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Test",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .get("/api/business/appeals")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by status", async () => {
      await Appeal.create({
        businessId: "BIZ-001",
        appealType: "wrong_fees",
        description: "Test",
        requestedBy: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .get("/api/business/appeals?status=approved")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
