const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");

let mongoServer;
let app;

const Announcement = require("../../../services/admin-service/src/models/Announcement");
const User = require("../../../services/admin-service/src/models/User");
const Role = require("../../../services/admin-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/admin-service/src/middleware/auth");

let adminToken;
let admin;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  await adminMongoose.connect(uri);

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

  admin = await User.create({
    role: adminRole._id,
    firstName: "Admin",
    lastName: "User",
    email: `admin_ann_${Date.now()}@test.com`,
    phoneNumber: `+6390000000${Math.floor(Math.random() * 1000)}`,
    passwordHash: await bcrypt.hash("Admin123!", 10),
    termsAccepted: true,
    isActive: true,
  });

  adminToken = signAccessToken({ _id: admin._id, role: adminRole }).token;
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
  await Announcement.deleteMany({});
});

describe("Announcement endpoints", () => {
  describe("POST /api/admin/announcements", () => {
    it("creates a draft announcement when status is draft", async () => {
      const response = await request(app)
        .post("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Draft title",
          body: "Draft body",
          status: "draft",
        })
        .expect(201);

      expect(response.body.status).toBe("draft");
      expect(response.body.isActive).toBe(false);
      expect(response.body.publishedAt).toBeNull();
      expect(response.body.title).toBe("Draft title");
    });

    it("rejects published announcements without title or body", async () => {
      await request(app)
        .post("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "published" })
        .expect(400);
    });

    it("rejects published announcements with invalid expiry dates", async () => {
      const publishAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 1000).toISOString();

      await request(app)
        .post("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Bad dates",
          body: "Bad expiry",
          status: "published",
          publishAt,
          expiresAt,
        })
        .expect(400);
    });

    it("creates a scheduled published announcement without immediate publishedAt", async () => {
      const publishAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const expiresAt = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      ).toISOString();

      const response = await request(app)
        .post("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Scheduled announcement",
          body: "This message will publish later",
          status: "published",
          publishAt,
          expiresAt,
        })
        .expect(201);

      expect(response.body.status).toBe("published");
      expect(response.body.publishAt).toBe(publishAt);
      expect(response.body.expiresAt).toBe(expiresAt);
      expect(response.body.publishedAt).toBeNull();
    });
  });

  describe("GET /api/admin/announcements/public", () => {
    it("returns only active published announcements that are currently visible", async () => {
      const now = new Date();
      const publishedAnnouncement = await Announcement.create({
        title: "Visible announcement",
        body: "This should be visible publicly",
        status: "published",
        isActive: true,
        publishAt: new Date(now.getTime() - 60 * 1000),
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        createdBy: admin._id,
      });

      await Announcement.create({
        title: "Future announcement",
        body: "Should not show yet",
        status: "published",
        isActive: true,
        publishAt: new Date(now.getTime() + 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        createdBy: admin._id,
      });

      const response = await request(app)
        .get("/api/admin/announcements/public")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some(
          (item) => item._id === String(publishedAnnouncement._id),
        ),
      ).toBe(true);
      expect(response.body.every((item) => item.status === "published")).toBe(
        true,
      );
    });
  });

  describe("GET /api/admin/announcements", () => {
    it("returns all announcements for admin users", async () => {
      await Announcement.create({
        title: "Draft announcement",
        body: "This is a draft",
        status: "draft",
        isActive: false,
        createdBy: admin._id,
      });

      const published = await Announcement.create({
        title: "Published announcement",
        body: "This is published",
        status: "published",
        isActive: true,
        publishAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        createdBy: admin._id,
      });

      const response = await request(app)
        .get("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.some((item) => item._id === String(published._id)),
      ).toBe(true);
    });
  });

  describe("PUT /api/admin/announcements/:id", () => {
    it("updates a draft announcement to published and sets publishedAt", async () => {
      const draft = await Announcement.create({
        title: "Draft update",
        body: "Draft body",
        status: "draft",
        isActive: false,
        createdBy: admin._id,
      });

      const response = await request(app)
        .put(`/api/admin/announcements/${draft._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Published now",
          body: "Now published",
          status: "published",
          isActive: true,
        })
        .expect(200);

      expect(response.body.status).toBe("published");
      expect(response.body.isActive).toBe(true);
      expect(response.body.publishedAt).toBeTruthy();
    });
  });

  describe("DELETE /api/admin/announcements/:id", () => {
    it("allows deleting a draft announcement", async () => {
      const draft = await Announcement.create({
        title: "Draft to delete",
        body: "Delete me",
        status: "draft",
        isActive: false,
        createdBy: admin._id,
      });

      const response = await request(app)
        .delete(`/api/admin/announcements/${draft._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
    });

    it("forbids deleting a previously posted announcement", async () => {
      const published = await Announcement.create({
        title: "Published to keep",
        body: "Keep me",
        status: "published",
        isActive: true,
        publishAt: new Date(Date.now() - 1000),
        publishedAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdBy: admin._id,
      });

      await request(app)
        .delete(`/api/admin/announcements/${published._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
