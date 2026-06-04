/**
 * Penalty Configuration Integration Tests
 * Covers UC-2O-1 through UC-2O-6 from Appendix K
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
  await mongoose.connect(uri);

  // Admin-service has its own node_modules/mongoose — connect it too
  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  if (adminMongoose !== mongoose && adminMongoose.connection.readyState === 0) {
    await adminMongoose.connect(uri);
  }

  const adminService = require("../../../services/admin-service/src/index");
  app = adminService.app;
});

afterAll(async () => {
  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  if (adminMongoose !== mongoose) {
    await adminMongoose.disconnect().catch(() => {});
  }
  await mongoose.disconnect();
  await mongoServer.stop();
});

const PenaltyConfiguration = require("../../../services/admin-service/src/models/PenaltyConfiguration");
const User = require("../../../services/admin-service/src/models/User");
const Role = require("../../../services/admin-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/admin-service/src/middleware/auth");
const {
  signStepUpToken,
} = require("../../../services/auth-service/src/middleware/auth");

let adminToken, ownerToken, adminId;

async function setupUsers() {
  const bcrypt = require("bcryptjs");
  const ts = Date.now();

  const adminRole = await Role.findOneAndUpdate(
    { slug: "admin" },
    { name: "Admin", slug: "admin" },
    { upsert: true, new: true },
  );
  const ownerRole = await Role.findOneAndUpdate(
    { slug: "business_owner" },
    { name: "Business Owner", slug: "business_owner" },
    { upsert: true, new: true },
  );

  const admin = await User.create({
    role: adminRole._id,
    firstName: "Admin",
    lastName: "Penalty",
    email: `admin_penalty_${ts}@test.com`,
    phoneNumber: `__unset__penalty_${ts}_a`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  adminId = admin._id.toString();
  adminToken = signAccessToken({ ...admin.toObject(), role: adminRole }).token;

  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "Penalty",
    email: `owner_penalty_${ts}@test.com`,
    phoneNumber: `__unset__penalty_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;
}

describe("Penalty Configuration (2O)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await PenaltyConfiguration.deleteMany({});
  });

  // ── Happy Paths ──

  function adminReq(method, path) {
    return request(app)
      [method](path)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("X-Step-Up-Token", signStepUpToken(adminId).token);
  }

  describe("UC-2O-1: Admin creates penalty config", () => {
    it("should create new penalty configuration", async () => {
      const res = await adminReq(
        "post",
        "/api/admin/penalty-configuration",
      ).send({
        surchargePercentage: 30,
        monthlyInterestRate: 3,
        penaltyStartDay: 15,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.surchargePercentage).toBe(30);
      expect(res.body.data.monthlyInterestRate).toBe(3);
      expect(res.body.data.penaltyStartDay).toBe(15);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe("Admin updates penalty config", () => {
    it("should update surcharge percentage", async () => {
      const config = await PenaltyConfiguration.create({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 20,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await adminReq(
        "put",
        `/api/admin/penalty-configuration/${config._id}`,
      ).send({ surchargePercentage: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.surchargePercentage).toBe(30);
    });
  });

  describe("UC-2O-2: Admin resets to defaults", () => {
    it("should reset penalty config to defaults", async () => {
      await PenaltyConfiguration.create({
        surchargePercentage: 50,
        monthlyInterestRate: 5,
        penaltyStartDay: 10,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await adminReq(
        "post",
        "/api/admin/penalty-configuration/reset",
      );

      expect(res.status).toBe(200);
      expect(res.body.data.surchargePercentage).toBe(25);
      expect(res.body.data.monthlyInterestRate).toBe(2);
      expect(res.body.data.penaltyStartDay).toBe(20);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe("GET /penalty-configuration — auto-seed", () => {
    it("should auto-seed default config if none exists", async () => {
      const res = await request(app)
        .get("/api/admin/penalty-configuration")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.surchargePercentage).toBe(25);
      expect(res.body.data.isActive).toBe(true);
    });

    it("should return existing active config", async () => {
      await PenaltyConfiguration.create({
        surchargePercentage: 40,
        monthlyInterestRate: 4,
        penaltyStartDay: 15,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await request(app)
        .get("/api/admin/penalty-configuration")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.surchargePercentage).toBe(40);
    });

    it("should list all configs when all=true", async () => {
      await PenaltyConfiguration.create({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 20,
        effectiveDate: new Date(),
        isActive: false,
      });
      await PenaltyConfiguration.create({
        surchargePercentage: 30,
        monthlyInterestRate: 3,
        penaltyStartDay: 15,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await request(app)
        .get("/api/admin/penalty-configuration?all=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ── Edge Cases ──

  describe("UC-2O-4: Cannot deactivate last active config", () => {
    it("should reject deactivation of last active config", async () => {
      const config = await PenaltyConfiguration.create({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 20,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await adminReq(
        "put",
        `/api/admin/penalty-configuration/${config._id}`,
      ).send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("Cannot deactivate");
    });

    it("should allow deactivation if another active config exists", async () => {
      const config1 = await PenaltyConfiguration.create({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 20,
        effectiveDate: new Date(),
        isActive: true,
      });
      await PenaltyConfiguration.create({
        surchargePercentage: 30,
        monthlyInterestRate: 3,
        penaltyStartDay: 15,
        effectiveDate: new Date(),
        isActive: true,
      });

      const res = await adminReq(
        "put",
        `/api/admin/penalty-configuration/${config1._id}`,
      ).send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe("UC-2O-5: penaltyStartDay validation", () => {
    it("should reject penaltyStartDay < 1", async () => {
      const res = await adminReq(
        "post",
        "/api/admin/penalty-configuration",
      ).send({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 0,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject penaltyStartDay > 31", async () => {
      const res = await adminReq(
        "post",
        "/api/admin/penalty-configuration",
      ).send({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 32,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should warn when penaltyStartDay is 31 (February issue)", async () => {
      const res = await adminReq(
        "post",
        "/api/admin/penalty-configuration",
      ).send({
        surchargePercentage: 25,
        monthlyInterestRate: 2,
        penaltyStartDay: 31,
      });

      expect(res.status).toBe(201);
      expect(res.body.warnings).toBeDefined();
      expect(res.body.warnings[0]).toContain("February");
    });
  });

  describe("Authorization", () => {
    it("should reject non-admin from creating config", async () => {
      const res = await request(app)
        .post("/api/admin/penalty-configuration")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          surchargePercentage: 25,
          monthlyInterestRate: 2,
          penaltyStartDay: 20,
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Not found", () => {
    it("should return 404 for non-existent config on update", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await adminReq(
        "put",
        `/api/admin/penalty-configuration/${fakeId}`,
      ).send({ surchargePercentage: 50 });

      expect(res.status).toBe(404);
    });
  });
});
