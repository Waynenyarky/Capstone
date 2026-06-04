const Session = require("../../services/auth-service/src/models/Session");
const User = require("../../services/auth-service/src/models/User");
const Role = require("../../services/auth-service/src/models/Role");
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const bcrypt = require("bcryptjs");

describe("Session Model", () => {
  let mongo;
  let testUser;

  beforeAll(async () => {
    setupTestEnvironment();
    mongo = await setupMongoDB();
  });

  afterAll(async () => {
    await teardownMongoDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
    let role = await Role.findOne({ slug: "business_owner" });
    if (!role) {
      role = await Role.create({
        name: "Business Owner",
        slug: "business_owner",
      });
    }
    testUser = await User.create({
      role: role._id,
      email: `test${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash("Test123!@#", 10),
      firstName: "Test",
      lastName: "User",
      termsAccepted: true,
      tokenVersion: 0,
    });
  });

  describe("Session Creation", () => {
    it("should create session with required fields", async () => {
      const session = await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.1",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      expect(session.userId.toString()).toBe(testUser._id.toString());
      expect(session.tokenVersion).toBe(0);
      expect(session.ipAddress).toBe("192.168.1.1");
      expect(session.isActive).toBe(true);
    });

    it("should create session with device info", async () => {
      const session = await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        deviceInfo: "Chrome on Windows",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      expect(session.userAgent).toBe("Mozilla/5.0");
      expect(session.deviceInfo).toBe("Chrome on Windows");
    });

    it("should set default values", async () => {
      const session = await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.1",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      expect(session.userAgent).toBe("");
      expect(session.deviceInfo).toBe("");
      expect(session.isActive).toBe(true);
      expect(session.invalidatedAt).toBeNull();
      expect(session.invalidationReason).toBe("");
    });
  });

  describe("Session Methods", () => {
    describe("isExpired", () => {
      it("should return false for active non-expired session", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        expect(session.isExpired()).toBe(false);
      });

      it("should return true for inactive session", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          isActive: false,
        });

        expect(session.isExpired()).toBe(true);
      });

      it("should return true for expired session", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() - 1000),
        });

        expect(session.isExpired()).toBe(true);
      });
    });

    describe("updateActivity", () => {
      it("should update lastActivityAt", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        const oldActivity = session.lastActivityAt;
        await new Promise((resolve) => setTimeout(resolve, 10));
        await session.updateActivity();

        expect(session.lastActivityAt.getTime()).toBeGreaterThan(
          oldActivity.getTime(),
        );
      });
    });

    describe("invalidate", () => {
      it("should invalidate session with reason", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        await session.invalidate("password_change");

        expect(session.isActive).toBe(false);
        expect(session.invalidatedAt).toBeDefined();
        expect(session.invalidationReason).toBe("password_change");
      });

      it("should use default reason if not provided", async () => {
        const session = await Session.create({
          userId: testUser._id,
          tokenVersion: testUser.tokenVersion,
          ipAddress: "192.168.1.1",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        await session.invalidate();

        expect(session.isActive).toBe(false);
        expect(session.invalidationReason).toBe("manual");
      });
    });
  });

  describe("Session Queries", () => {
    it("should find active sessions for user", async () => {
      await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.1",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.2",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isActive: false,
      });

      const activeSessions = await Session.find({
        userId: testUser._id,
        isActive: true,
      });
      expect(activeSessions).toHaveLength(1);
    });

    it("should find expired sessions", async () => {
      await Session.create({
        userId: testUser._id,
        tokenVersion: testUser.tokenVersion,
        ipAddress: "192.168.1.1",
        expiresAt: new Date(Date.now() - 1000),
      });

      const expiredSessions = await Session.find({
        expiresAt: { $lt: new Date() },
      });
      expect(expiredSessions).toHaveLength(1);
    });
  });
});
