/**
 * General Permits Integration Tests
 * Covers UC-2G-1 through UC-2G-7 from Appendix K
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

const GeneralPermit = require("../../../services/business-service/src/models/GeneralPermit");
const User = require("../../../services/business-service/src/models/User");
const Role = require("../../../services/business-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/business-service/src/middleware/auth");

let ownerToken, staffToken, ownerId, staffId;

async function setupUsers() {
  const bcrypt = require("bcryptjs");
  const ts = Date.now();

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

  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "General",
    email: `owner_gen_${ts}@test.com`,
    phoneNumber: `__unset__gen_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;

  const staff = await User.create({
    role: staffRole._id,
    firstName: "Officer",
    lastName: "General",
    email: `officer_gen_${ts}@test.com`,
    phoneNumber: `__unset__gen_${ts}_s`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  });
  staffId = staff._id.toString();
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token;
}

describe("General Permits (2G)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await GeneralPermit.deleteMany({});
  });

  // ── Happy Paths ──

  describe("UC-2G-1: Owner applies for general permit", () => {
    it("should create general permit application", async () => {
      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "bazaar_festival_vendors",
          requirements: [
            { type: "barangay_clearance", fileUrl: "uploads/clearance.pdf" },
          ],
          businessPlateNo: "BP-001",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("submitted");
      expect(res.body.data.permitCategory).toBe("bazaar_festival_vendors");
      expect(res.body.data.applicantId).toBe(ownerId);
    });
  });

  describe("UC-2G-2: Multiple general permits per owner", () => {
    it("should allow multiple permits for different categories", async () => {
      await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "bazaar_festival_vendors",
          requirements: [{ type: "doc", fileUrl: "a.pdf" }],
        });

      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "firecrackers_stallholders",
          requirements: [{ type: "doc", fileUrl: "b.pdf" }],
        });

      expect(res.status).toBe(201);
    });
  });

  describe("UC-2G-6: Multiple applications per category", () => {
    it("should allow multiple applications for same category (e.g. different events)", async () => {
      await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "bazaar_festival_vendors",
          requirements: [{ type: "doc", fileUrl: "event1.pdf" }],
        });

      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "bazaar_festival_vendors",
          requirements: [{ type: "doc", fileUrl: "event2.pdf" }],
        });

      expect(res.status).toBe(201);
    });
  });

  describe("Officer approves general permit", () => {
    it("should approve and record approver", async () => {
      const permit = await GeneralPermit.create({
        permitCategory: "cooperative",
        requirements: [{ type: "doc", fileUrl: "coop.pdf" }],
        applicantId: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .put(`/api/business/general-permits/${permit._id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");
      expect(res.body.data.approvedBy).toBe(staffId);
      expect(res.body.data.issuedAt).toBeDefined();
    });
  });

  // ── Edge Cases ──

  describe("UC-2G-4: No requirements submitted", () => {
    it("should reject when requirements array is empty", async () => {
      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "cooperative",
          requirements: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("NO_REQUIREMENTS");
    });

    it("should reject when requirements not provided", async () => {
      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "cooperative",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("NO_REQUIREMENTS");
    });
  });

  describe("Invalid permit category", () => {
    it("should reject invalid category", async () => {
      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          permitCategory: "totally_fake_category",
          requirements: [{ type: "doc", fileUrl: "a.pdf" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_CATEGORY");
    });
  });

  describe("Cannot update resolved permits", () => {
    it("should reject update on already approved permit", async () => {
      const permit = await GeneralPermit.create({
        permitCategory: "cooperative",
        requirements: [{ type: "doc", fileUrl: "coop.pdf" }],
        applicantId: ownerId,
        status: "approved",
        approvedBy: staffId,
        issuedAt: new Date(),
      });

      const res = await request(app)
        .put(`/api/business/general-permits/${permit._id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "rejected" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ALREADY_RESOLVED");
    });
  });

  describe("Validation", () => {
    it("should require permitCategory", async () => {
      const res = await request(app)
        .post("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ requirements: [{ type: "doc", fileUrl: "a.pdf" }] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 for non-existent permit", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/business/general-permits/${fakeId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /general-permits — list", () => {
    it("should list user general permits", async () => {
      await GeneralPermit.create({
        permitCategory: "peddlers",
        requirements: [{ type: "doc", fileUrl: "a.pdf" }],
        applicantId: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .get("/api/business/general-permits")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by status", async () => {
      await GeneralPermit.create({
        permitCategory: "peddlers",
        requirements: [{ type: "doc", fileUrl: "a.pdf" }],
        applicantId: ownerId,
        status: "submitted",
      });

      const res = await request(app)
        .get("/api/business/general-permits?status=approved")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
