/**
 * Occupational Permits Integration Tests
 * Covers UC-2H-1 through UC-2H-8 from Appendix K
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

const OccupationalPermit = require("../../../services/business-service/src/models/OccupationalPermit");
const BusinessProfile = require("../../../services/business-service/src/models/BusinessProfile");
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
    firstName: "Employee",
    lastName: "OccPermit",
    email: `emp_occ_${ts}@test.com`,
    phoneNumber: `__unset__occ_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;

  const staff = await User.create({
    role: staffRole._id,
    firstName: "Officer",
    lastName: "OccPermit",
    email: `officer_occ_${ts}@test.com`,
    phoneNumber: `__unset__occ_${ts}_s`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  });
  staffId = staff._id.toString();
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token;
}

describe("Occupational Permits (2H)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await OccupationalPermit.deleteMany({});
    await BusinessProfile.deleteMany({});
  });

  async function seedBusinessWithBP(plateNo = "BP-12345") {
    return BusinessProfile.create({
      userId: new mongoose.Types.ObjectId(),
      businesses: [
        {
          businessId: `BIZ-${Date.now()}`,
          businessName: "Valid Business",
          businessRegistrationNumber: `BRN-${Date.now()}`,
          isPrimary: true,
          businessPlateNo: plateNo,
        },
      ],
    });
  }

  const validApplication = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    gender: "male",
    civilStatus: "single",
    dateOfBirth: "1990-01-15",
    address: {
      street: "123 Main St",
      city: "General Trias",
      barangay: "",
      province: "",
      zipCode: "",
    },
    education: "college",
    businessPlateNo: "BP-12345",
    employer: "ABC Corp",
    company: "ABC Corp",
    position: "Cook",
    type: "employed",
  };

  // ── Happy Paths ──

  describe("UC-2H-1: Employee applies for occupational permit (food handler)", () => {
    it("should create permit with valid BP number", async () => {
      await seedBusinessWithBP("BP-12345");

      const res = await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(validApplication);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.businessPlateNo).toBe("BP-12345");
      expect(res.body.data.applicantId).toBe(ownerId);
    });
  });

  describe("UC-2H-7: Officer updates lab exam status", () => {
    it("should update individual lab exam results", async () => {
      await seedBusinessWithBP("BP-12345");

      const createRes = await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(validApplication);

      const permitId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/business/occupational-permits/${permitId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          status: "lab_pending",
          labExams: {
            urinalysis: { status: "complete", result: "normal" },
            fecalysis: { status: "complete", result: "normal" },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("lab_pending");
    });
  });

  // ── Edge Cases ──

  describe("UC-2H-4: BP_NUMBER_NOT_FOUND", () => {
    it("should reject when business plate number not in system", async () => {
      const res = await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          ...validApplication,
          businessPlateNo: "BP-NONEXISTENT",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("BP_NUMBER_NOT_FOUND");
    });
  });

  describe("UC-2H-6: Lab exam failure rejects application", () => {
    it("should auto-reject when any lab exam fails", async () => {
      await seedBusinessWithBP("BP-12345");

      const createRes = await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(validApplication);

      const permitId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/business/occupational-permits/${permitId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          labExams: {
            urinalysis: { status: "complete", result: "normal" },
            hepaB: { status: "failed", result: "positive" },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("rejected");
    });
  });

  describe("Validation", () => {
    it("should require businessPlateNo", async () => {
      const res = await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          ...validApplication,
          businessPlateNo: undefined,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 for non-existent permit on update", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/business/occupational-permits/${fakeId}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /occupational-permits — list", () => {
    it("should list user occupational permits", async () => {
      await seedBusinessWithBP("BP-12345");

      await request(app)
        .post("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(validApplication);

      const res = await request(app)
        .get("/api/business/occupational-permits")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
