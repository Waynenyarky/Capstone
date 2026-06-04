/**
 * Dashboard Integration Tests
 * Covers UC-2L-1 through UC-2L-6 from Appendix K
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
const PostRequirement = require("../../../services/business-service/src/models/PostRequirement");
const Appeal = require("../../../services/business-service/src/models/Appeal");
const EditRequest = require("../../../services/business-service/src/models/EditRequest");
const GeneralPermit = require("../../../services/business-service/src/models/GeneralPermit");
const OccupationalPermit = require("../../../services/business-service/src/models/OccupationalPermit");
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
    lastName: "Dashboard",
    email: `owner_dash_${ts}@test.com`,
    phoneNumber: `__unset__dash_${ts}_o`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });
  ownerId = owner._id.toString();
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;

  const staff = await User.create({
    role: staffRole._id,
    firstName: "Officer",
    lastName: "Dashboard",
    email: `officer_dash_${ts}@test.com`,
    phoneNumber: `__unset__dash_${ts}_s`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
    isStaff: true,
    isActive: true,
  });
  staffId = staff._id.toString();
  staffToken = signAccessToken({ ...staff.toObject(), role: staffRole }).token;
}

describe("Dashboard (2L)", () => {
  beforeAll(async () => {
    await setupUsers();
  });

  beforeEach(async () => {
    await BusinessProfile.deleteMany({});
    await PostRequirement.deleteMany({});
    await Appeal.deleteMany({});
    await EditRequest.deleteMany({});
    await GeneralPermit.deleteMany({});
    await OccupationalPermit.deleteMany({});
  });

  // ── Owner Stats ──

  describe("GET /dashboard/owner-stats", () => {
    describe("UC-2L-1: Owner dashboard loads real data", () => {
      it("should return correct counts with populated data", async () => {
        // Create profile with 2 businesses (1 active, 1 closed)
        await BusinessProfile.create({
          userId: ownerId,
          businesses: [
            {
              businessId: "BIZ-ACTIVE",
              businessName: "Active Business",
              businessRegistrationNumber: "BRN-001",
              isPrimary: true,
              businessStatus: "active",
              applicationStatus: "submitted",
            },
            {
              businessId: "BIZ-CLOSED",
              businessName: "Closed Business",
              businessRegistrationNumber: "BRN-002",
              businessStatus: "closed",
            },
          ],
        });

        // Create post-requirements (1 pending, 1 overdue, 1 verified)
        await PostRequirement.create({
          businessId: "BIZ-ACTIVE",
          ownerId,
          requirementType: "real_property_tax",
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await PostRequirement.create({
          businessId: "BIZ-ACTIVE",
          ownerId,
          requirementType: "sanitary",
          status: "pending",
          dueDate: new Date("2020-01-01"), // overdue
        });
        await PostRequirement.create({
          businessId: "BIZ-ACTIVE",
          ownerId,
          requirementType: "zoning",
          status: "verified",
          dueDate: new Date(),
        });

        // Create appeals (1 open, 1 resolved)
        await Appeal.create({
          businessId: "BIZ-ACTIVE",
          appealType: "wrong_fees",
          description: "Open appeal",
          requestedBy: ownerId,
          status: "submitted",
        });
        await Appeal.create({
          businessId: "BIZ-ACTIVE",
          appealType: "wrong_violations",
          description: "Resolved appeal",
          requestedBy: ownerId,
          status: "approved",
        });

        // Create edit request
        await EditRequest.create({
          businessId: "BIZ-ACTIVE",
          requestedBy: ownerId,
          fieldName: "address",
          currentValue: "Old",
          requestedValue: "New",
          status: "pending",
        });

        const res = await request(app)
          .get("/api/business/dashboard/owner-stats")
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(res.status).toBe(200);
        const d = res.body.data;
        expect(d.totalBusinesses).toBe(2);
        expect(d.activeBusinesses).toBe(1);
        expect(d.pendingPostRequirements).toBe(2); // both pending, regardless of overdue
        expect(d.overduePostRequirements).toBe(1);
        expect(d.openAppeals).toBe(1);
        expect(d.pendingEditRequests).toBe(1);
        expect(d.recentApplications).toHaveLength(2);
      });
    });

    describe("UC-2L-4: Owner has no businesses — empty state", () => {
      it("should return zeros when owner has no profile", async () => {
        const res = await request(app)
          .get("/api/business/dashboard/owner-stats")
          .set("Authorization", `Bearer ${ownerToken}`);

        expect(res.status).toBe(200);
        const d = res.body.data;
        expect(d.totalBusinesses).toBe(0);
        expect(d.activeBusinesses).toBe(0);
        expect(d.renewalsDue).toBe(0);
        expect(d.pendingPostRequirements).toBe(0);
        expect(d.overduePostRequirements).toBe(0);
        expect(d.openAppeals).toBe(0);
        expect(d.pendingEditRequests).toBe(0);
        expect(d.recentApplications).toHaveLength(0);
      });
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/business/dashboard/owner-stats");

      expect(res.status).toBe(401);
    });
  });

  // ── Manager Stats ──

  describe("GET /dashboard/manager-stats", () => {
    describe("UC-2L-2: Manager dashboard shows real data", () => {
      it("should return correct aggregate counts", async () => {
        // Create profiles
        await BusinessProfile.create({
          userId: ownerId,
          businesses: [
            {
              businessId: "BIZ-1",
              businessName: "Business 1",
              businessRegistrationNumber: "BRN-001",
              isPrimary: true,
              businessStatus: "active",
              applicationStatus: "submitted",
            },
          ],
        });

        // Create general permit (approved)
        await GeneralPermit.create({
          permitCategory: "cooperative",
          requirements: [{ type: "doc", fileUrl: "a.pdf" }],
          applicantId: ownerId,
          status: "approved",
          approvedBy: staffId,
          issuedAt: new Date(),
        });

        // Create occupational permit (approved)
        await OccupationalPermit.create({
          applicantId: ownerId,
          businessPlateNo: "BP-001",
          status: "approved",
        });

        // Create pending post-requirement
        await PostRequirement.create({
          businessId: "BIZ-1",
          ownerId,
          requirementType: "real_property_tax",
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // Create open appeal
        await Appeal.create({
          businessId: "BIZ-1",
          appealType: "wrong_fees",
          description: "Test",
          requestedBy: ownerId,
          status: "submitted",
        });

        const res = await request(app)
          .get("/api/business/dashboard/manager-stats")
          .set("Authorization", `Bearer ${staffToken}`);

        expect(res.status).toBe(200);
        const d = res.body.data;
        expect(d.totalBusinessProfiles).toBeGreaterThanOrEqual(1);
        expect(d.pendingApplications).toBeGreaterThanOrEqual(1);
        expect(d.generalPermitsIssued).toBe(1);
        expect(d.occupationalPermitsIssued).toBe(1);
        expect(d.pendingPostRequirements).toBeGreaterThanOrEqual(1);
        expect(d.openAppeals).toBeGreaterThanOrEqual(1);
        expect(d.permitBreakdown).toBeDefined();
      });
    });

    it("should reject non-staff access", async () => {
      const res = await request(app)
        .get("/api/business/dashboard/manager-stats")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
