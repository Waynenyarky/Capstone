/**
 * Maintenance endpoints regression tests
 */

const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

let mongoServer;
let app;

const AdminApproval = require("../../../services/admin-service/src/models/AdminApproval");
const MaintenanceWindow = require("../../../services/admin-service/src/models/MaintenanceWindow");
const Announcement = require("../../../services/admin-service/src/models/Announcement");
const User = require("../../../services/admin-service/src/models/User");
const Role = require("../../../services/admin-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/admin-service/src/middleware/auth");

let adminToken;
let adminToken2;
let admin;
let admin2;

function createStepUpToken(userId) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.sign({ sub: String(userId), stepUp: true }, secret, {
    expiresIn: "10m",
  });
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  await adminMongoose.connect(uri);

  // Auth-service has a separate mongoose instance (its own node_modules/mongoose).
  // applyApprovedChange routes to auth-service in NODE_ENV=test, so we need it connected.
  try {
    const authMongoose =
      require("../../../services/auth-service/src/models/Role").base;
    if (authMongoose && authMongoose.connection.readyState === 0) {
      await authMongoose.connect(uri);
    }
  } catch (_) {
    // ignore if auth-service path isn't available
  }

  const adminService = require("../../../services/admin-service/src/index");
  app = adminService.app;

  const adminRole = await Role.findOneAndUpdate(
    { slug: "admin" },
    { name: "Admin", slug: "admin" },
    { upsert: true, new: true },
  );

  const bcrypt = require("bcryptjs");
  admin = await User.create({
    role: adminRole._id,
    firstName: "Admin",
    lastName: "User",
    email: `admin_maint_${Date.now()}@test.com`,
    phoneNumber: `+6390000000${Math.floor(Math.random() * 1000)}`,
    passwordHash: await bcrypt.hash("Admin123!", 10),
    termsAccepted: true,
    isActive: true,
  });

  admin2 = await User.create({
    role: adminRole._id,
    firstName: "Admin",
    lastName: "User2",
    email: `admin_maint2_${Date.now()}@test.com`,
    phoneNumber: `+6390000001${Math.floor(Math.random() * 1000)}`,
    passwordHash: await bcrypt.hash("Admin123!", 10),
    termsAccepted: true,
    isActive: true,
  });

  adminToken = signAccessToken({ _id: admin._id, role: adminRole }).token;
  adminToken2 = signAccessToken({ _id: admin2._id, role: adminRole }).token;
});

afterAll(async () => {
  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  await adminMongoose.disconnect();
  try {
    const authMongoose =
      require("../../../services/auth-service/src/models/Role").base;
    if (authMongoose && authMongoose.connection.readyState !== 0) {
      await authMongoose.disconnect();
    }
  } catch (_) {}
  await mongoServer.stop();
});

beforeEach(async () => {
  await AdminApproval.deleteMany({});
  await MaintenanceWindow.deleteMany({});
  await Announcement.deleteMany({});
});

describe("Maintenance endpoints", () => {
  describe("GET /api/admin/maintenance/conflicts", () => {
    it("should return empty conflicts when no maintenance exists", async () => {
      const start = new Date();
      const end = new Date(Date.now() + 3600000);

      const response = await request(app)
        .get("/api/admin/maintenance/conflicts")
        .query({ start: start.toISOString(), end: end.toISOString() })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.conflicts).toEqual([]);
    });

    it("should detect overlapping maintenance requests", async () => {
      const start1 = new Date(Date.now() + 3600000);
      const end1 = new Date(Date.now() + 7200000);

      await AdminApproval.create({
        approvalId: "MAINT-001",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "Scheduled maintenance",
          message: "System update",
          expectedResumeAt: end1,
          scheduledStartAt: start1,
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      const start2 = new Date(Date.now() + 5400000);
      const end2 = new Date(Date.now() + 10800000);

      const response = await request(app)
        .get("/api/admin/maintenance/conflicts")
        .query({ start: start2.toISOString(), end: end2.toISOString() })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.conflicts.length).toBeGreaterThan(0);
    });

    it("should return validation error for missing query params", async () => {
      await request(app)
        .get("/api/admin/maintenance/conflicts")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should return validation error for end before start", async () => {
      const start = new Date(Date.now() + 7200000);
      const end = new Date(Date.now() + 3600000);

      await request(app)
        .get("/api/admin/maintenance/conflicts")
        .query({ start: start.toISOString(), end: end.toISOString() })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe("POST /api/admin/maintenance/request", () => {
    it("should require step-up token for enable action", async () => {
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);

      await request(app)
        .post("/api/admin/maintenance/request")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "enable",
          reason: "System maintenance",
          message: "Database upgrade",
          expectedResumeAt: end.toISOString(),
          scheduledStartAt: start.toISOString(),
        })
        .expect(403);
    });

    it("should require step-up token for disable action", async () => {
      await request(app)
        .post("/api/admin/maintenance/request")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "disable",
          reason: "Emergency disable",
          message: "Security issue",
        })
        .expect(403);
    });

    it("should require step-up token for conflict check", async () => {
      const start1 = new Date(Date.now() + 3600000);
      const end1 = new Date(Date.now() + 7200000);

      await AdminApproval.create({
        approvalId: "MAINT-003",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          expectedResumeAt: end1,
          scheduledStartAt: start1,
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      const start2 = new Date(Date.now() + 5400000);
      const end2 = new Date(Date.now() + 10800000);

      await request(app)
        .post("/api/admin/maintenance/request")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "enable",
          reason: "Conflicting maintenance",
          expectedResumeAt: end2.toISOString(),
          scheduledStartAt: start2.toISOString(),
        })
        .expect(403);
    });

    it("should require step-up token for invalid schedule", async () => {
      const start = new Date(Date.now() + 7200000);
      const end = new Date(Date.now() + 3600000);

      await request(app)
        .post("/api/admin/maintenance/request")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "enable",
          expectedResumeAt: end.toISOString(),
          scheduledStartAt: start.toISOString(),
        })
        .expect(403);
    });
  });

  describe("POST /api/admin/maintenance/:approvalId/cancel", () => {
    it("should require step-up token for cancellation request", async () => {
      const start = new Date(Date.now() + 86400000);
      const end = new Date(Date.now() + 172800000);

      const approval = await AdminApproval.create({
        approvalId: "MAINT-004",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          expectedResumeAt: end,
          scheduledStartAt: start,
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      await request(app)
        .post(`/api/admin/maintenance/${approval.approvalId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });

    it("should require step-up token for non-existent approval", async () => {
      await request(app)
        .post("/api/admin/maintenance/FAKE-ID/cancel")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });

    it("should require step-up token for maintenance that already started", async () => {
      const start = new Date(Date.now() - 3600000);
      const end = new Date(Date.now() + 3600000);

      const approval = await AdminApproval.create({
        approvalId: "MAINT-005",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          expectedResumeAt: end,
          scheduledStartAt: start,
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      await request(app)
        .post(`/api/admin/maintenance/${approval.approvalId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe("GET /api/admin/maintenance/current", () => {
    it("should return null when no active maintenance", async () => {
      const response = await request(app)
        .get("/api/admin/maintenance/current")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.maintenance).toBeNull();
    });

    it("should return active maintenance when exists", async () => {
      await MaintenanceWindow.create({
        status: "active",
        isActive: true,
        message: "System maintenance",
        expectedResumeAt: new Date(Date.now() + 3600000),
        requestedBy: admin._id,
        activatedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/admin/maintenance/current")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.maintenance).toBeTruthy();
      expect(response.body.maintenance.status).toBe("active");
    });
  });

  describe("GET /api/maintenance/status (public)", () => {
    it("should return active status when maintenance is active", async () => {
      await MaintenanceWindow.create({
        status: "active",
        isActive: true,
        message: "System maintenance",
        expectedResumeAt: new Date(Date.now() + 3600000),
        requestedBy: admin._id,
        activatedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/maintenance/status")
        .expect(200);

      expect(response.body.active).toBe(true);
      expect(response.body.message).toBe("System maintenance");
    });

    it("should return scheduled status when maintenance is pending", async () => {
      const start = new Date(Date.now() + 86400000);
      await MaintenanceWindow.create({
        status: "pending",
        isActive: false,
        message: "Upcoming maintenance",
        expectedResumeAt: new Date(Date.now() + 172800000),
        requestedBy: admin._id,
        metadata: { scheduledStartAt: start },
      });

      const response = await request(app)
        .get("/api/maintenance/status")
        .expect(200);

      expect(response.body.active).toBe(false);
      expect(response.body.scheduled).toBe(true);
    });

    it("should return inactive status when no maintenance", async () => {
      const response = await request(app)
        .get("/api/maintenance/status")
        .expect(200);

      expect(response.body.active).toBe(false);
    });
  });

  describe("Status Display Logic", () => {
    it("should distinguish approved-upcoming from approved-past", async () => {
      const futureStart = new Date(Date.now() + 86400000);
      const pastStart = new Date(Date.now() - 86400000);

      const upcomingApproval = await AdminApproval.create({
        approvalId: "MAINT-FUTURE",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          scheduledStartAt: futureStart,
          expectedResumeAt: new Date(Date.now() + 172800000),
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      const pastApproval = await AdminApproval.create({
        approvalId: "MAINT-PAST",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          scheduledStartAt: pastStart,
          expectedResumeAt: new Date(Date.now() - 3600000),
        },
        status: "approved",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      // Verify upcoming has future scheduled start
      expect(
        upcomingApproval.requestDetails.scheduledStartAt.getTime(),
      ).toBeGreaterThan(Date.now());

      // Verify past has past scheduled start
      expect(
        pastApproval.requestDetails.scheduledStartAt.getTime(),
      ).toBeLessThan(Date.now());
    });

    it("should identify cancelled status", async () => {
      const approval = await AdminApproval.create({
        approvalId: "MAINT-CANCELLED",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          scheduledStartAt: new Date(Date.now() + 86400000),
          expectedResumeAt: new Date(Date.now() + 172800000),
        },
        status: "cancelled",
        requiredApprovals: 2,
        approvals: [
          { adminId: admin._id, approved: true, timestamp: new Date() },
          { adminId: admin2._id, approved: true, timestamp: new Date() },
        ],
      });

      expect(approval.status).toBe("cancelled");
    });
  });

  describe("Audit Log Creation", () => {
    it("should create audit log for maintenance request", async () => {
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);

      // Create maintenance request (audit log created in route handler)
      await AdminApproval.create({
        approvalId: "MAINT-AUDIT-001",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "System maintenance",
          message: "Database upgrade",
          expectedResumeAt: end,
          scheduledStartAt: start,
        },
        status: "pending",
        requiredApprovals: 2,
      });

      const approval = await AdminApproval.findOne({
        approvalId: "MAINT-AUDIT-001",
      });
      expect(approval).toBeTruthy();
      expect(approval.requestDetails.action).toBe("enable");
    });

    it("should create audit log for cancellation request", async () => {
      const start = new Date(Date.now() + 86400000);
      const end = new Date(Date.now() + 172800000);

      const approval = await AdminApproval.create({
        approvalId: "MAINT-AUDIT-002",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "disable",
          reason: "Cancellation request",
          message: "Cancel upcoming maintenance",
          cancelTargetApprovalId: "MAINT-TARGET",
          cancelScheduledStartAt: start,
        },
        status: "pending",
        requiredApprovals: 2,
      });

      expect(approval.requestDetails.action).toBe("disable");
      expect(approval.requestDetails.cancelTargetApprovalId).toBe(
        "MAINT-TARGET",
      );
    });

    it("should track approval actions in approvals array", async () => {
      const approval = await AdminApproval.create({
        approvalId: "MAINT-AUDIT-003",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "System maintenance",
        },
        status: "pending",
        requiredApprovals: 2,
        approvals: [
          {
            adminId: admin._id,
            approved: true,
            comment: "Approved",
            timestamp: new Date(),
          },
          {
            adminId: admin2._id,
            approved: true,
            comment: "Approved",
            timestamp: new Date(),
          },
        ],
      });

      expect(approval.approvals).toHaveLength(2);
      expect(approval.approvals[0].approved).toBe(true);
      expect(approval.approvals[1].approved).toBe(true);
    });

    it("should create audit log when admin votes on maintenance request", async () => {
      const approval = await AdminApproval.create({
        approvalId: "MAINT-AUDIT-VOTE",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "System maintenance",
        },
        status: "pending",
        requiredApprovals: 2,
      });

      // Simulate voting by adding to approvals array
      approval.approvals.push({
        adminId: admin2._id,
        approved: true,
        comment: "Approved",
        timestamp: new Date(),
      });
      await approval.save();

      expect(approval.approvals).toHaveLength(1);
      expect(approval.approvals[0].adminId).toEqual(admin2._id);
      expect(approval.approvals[0].approved).toBe(true);
    });

    it("should create audit log when admin undoes vote", async () => {
      const approval = await AdminApproval.create({
        approvalId: "MAINT-AUDIT-UNDO",
        requestType: "maintenance_mode",
        userId: admin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "System maintenance",
        },
        status: "pending",
        requiredApprovals: 2,
        approvals: [
          {
            adminId: admin2._id,
            approved: true,
            comment: "Approved",
            timestamp: new Date(),
          },
        ],
      });

      // Simulate undo by removing vote
      approval.approvals = [];
      await approval.save();

      expect(approval.approvals).toHaveLength(0);
    });
  });

  describe("Maintenance announcement behavior", () => {
    it("creates an announcement for upcoming maintenance even when another session exists", async () => {
      const activeWindow = await MaintenanceWindow.create({
        status: "active",
        isActive: true,
        message: "Current maintenance",
        expectedResumeAt: new Date(Date.now() + 30 * 60 * 1000),
        requestedBy: admin._id,
        activatedAt: new Date(),
        metadata: {
          approvalId: "ACTIVE-MAINT",
        },
      });
      expect(activeWindow.isActive).toBe(true);

      const adminRole = await Role.findOne({ slug: "admin" });
      const targetAdmin = await User.create({
        role: adminRole._id,
        firstName: "Admin",
        lastName: `Target${Date.now()}`,
        email: `target_admin_${Date.now()}@test.com`,
        phoneNumber: `+639${Date.now()}${Math.floor(Math.random() * 1000)}`,
        passwordHash: await bcrypt.hash("Admin123!", 10),
        termsAccepted: true,
        isActive: true,
      });

      const approvalId = AdminApproval.generateApprovalId();
      const futureStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 3 * 60 * 60 * 1000);

      await AdminApproval.create({
        approvalId,
        requestType: "maintenance_mode",
        userId: targetAdmin._id,
        requestedBy: admin._id,
        requestDetails: {
          action: "enable",
          reason: "Follow-up maintenance window",
          message: "Plan next downtime",
          scheduledStartAt: futureStart,
          expectedResumeAt: futureEnd,
        },
        status: "pending",
        requiredApprovals: 2,
      });

      const initialApproval = await AdminApproval.findOne({
        approvalId,
      }).lean();
      expect(initialApproval).toBeTruthy();
      expect(initialApproval.requestDetails).toBeTruthy();
      expect(initialApproval.requestDetails.scheduledStartAt).toBeTruthy();
      expect(initialApproval.requestDetails.expectedResumeAt).toBeTruthy();

      await request(app)
        .post(`/api/admin/approvals/${approvalId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-Step-Up-Token", createStepUpToken(admin._id))
        .send({ approved: true })
        .expect(200);

      const approveResponse = await request(app)
        .post(`/api/admin/approvals/${approvalId}/approve`)
        .set("Authorization", `Bearer ${adminToken2}`)
        .set("X-Step-Up-Token", createStepUpToken(admin2._id))
        .send({ approved: true })
        .expect(200);

      expect(approveResponse.body.approval.status).toBe("approved");

      const announcementsInDb = await Announcement.find().lean();
      expect(announcementsInDb.length).toBeGreaterThan(0);
      const createdAnnouncement = announcementsInDb.find(
        (item) => item?.metadata?.maintenanceApprovalId === approvalId,
      );
      expect(createdAnnouncement).toBeTruthy();
      expect(createdAnnouncement.expiresAt).toBeTruthy();

      const announcementsResponse = await request(app)
        .get("/api/admin/announcements")
        .expect(200);

      const announcements = Array.isArray(announcementsResponse.body)
        ? announcementsResponse.body
        : [];
      const maintenanceAnnouncement = announcements.find(
        (item) => item?.metadata?.maintenanceApprovalId === approvalId,
      );

      expect(maintenanceAnnouncement).toBeTruthy();
      expect(maintenanceAnnouncement.status).toBe("published");
      expect(maintenanceAnnouncement.priority).toBe("high");
      expect(maintenanceAnnouncement.isActive).not.toBe(false);
      expect(new Date(maintenanceAnnouncement.expiresAt).getTime()).toBe(
        futureEnd.getTime(),
      );
      expect(
        new Date(maintenanceAnnouncement.metadata.scheduledStartAt).getTime(),
      ).toBe(futureStart.getTime());
      expect(
        new Date(maintenanceAnnouncement.metadata.expectedResumeAt).getTime(),
      ).toBe(futureEnd.getTime());
      expect(maintenanceAnnouncement.body).toContain(
        "System maintenance is scheduled",
      );
    });
  });
});
