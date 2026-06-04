const User = require("../../services/auth-service/src/models/User");
const Role = require("../../services/auth-service/src/models/Role");
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const bcrypt = require("bcryptjs");

describe("User Model", () => {
  let mongo;
  let businessOwnerRole;

  beforeAll(async () => {
    setupTestEnvironment();
    mongo = await setupMongoDB();
  });

  afterAll(async () => {
    await teardownMongoDB();
  });

  beforeEach(async () => {
    await cleanupTestData();
    businessOwnerRole = await Role.findOne({ slug: "business_owner" });
    if (!businessOwnerRole) {
      businessOwnerRole = await Role.create({
        name: "Business Owner",
        slug: "business_owner",
      });
    }
  });

  describe("User Creation", () => {
    it("should create user with required fields", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
      });

      expect(user.email).toBe("test@example.com");
      expect(user.firstName).toBe("Test");
      expect(user.lastName).toBe("User");
      expect(user.termsAccepted).toBe(true);
    });

    it("should create user with PIS fields", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        middleName: "Maria",
        suffix: "Jr.",
        sex: "female",
        address: {
          street: "123 Main St",
          barangay: "Barangay 1",
          city: "City",
          province: "Province",
          zipCode: "1234",
        },
      });

      expect(user.middleName).toBe("Maria");
      expect(user.suffix).toBe("Jr.");
      expect(user.sex).toBe("female");
      expect(user.address.street).toBe("123 Main St");
    });

    it("should enforce email uniqueness", async () => {
      await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
      });

      await expect(
        User.create({
          role: businessOwnerRole._id,
          email: "test@example.com",
          passwordHash: await bcrypt.hash("Test123!@#", 10),
          firstName: "Test2",
          lastName: "User2",
          termsAccepted: true,
          tokenVersion: 0,
        }),
      ).rejects.toThrow();
    });

    it("should lowercase email automatically", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "TEST@EXAMPLE.COM",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
      });

      expect(user.email).toBe("test@example.com");
    });

    it("should require role", async () => {
      await expect(
        User.create({
          email: "test@example.com",
          passwordHash: await bcrypt.hash("Test123!@#", 10),
          firstName: "Test",
          lastName: "User",
          termsAccepted: true,
          tokenVersion: 0,
        }),
      ).rejects.toThrow();
    });

    it("should require passwordHash", async () => {
      await expect(
        User.create({
          role: businessOwnerRole._id,
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          termsAccepted: true,
          tokenVersion: 0,
        }),
      ).rejects.toThrow();
    });
  });

  describe("MFA Fields", () => {
    it("should store MFA configuration", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        mfaEnabled: true,
        mfaMethod: "authenticator",
        mfaSecret: "JBSWY3DPEHPK3PXP",
      });

      expect(user.mfaEnabled).toBe(true);
      expect(user.mfaMethod).toBe("authenticator");
      expect(user.mfaSecret).toBe("JBSWY3DPEHPK3PXP");
    });

    it("should store MFA re-enrollment flag", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        mfaReEnrollmentRequired: true,
      });

      expect(user.mfaReEnrollmentRequired).toBe(true);
    });
  });

  describe("Account Lockout Fields", () => {
    it("should store failed verification attempts", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        failedVerificationAttempts: 3,
        accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(user.failedVerificationAttempts).toBe(3);
      expect(user.accountLockedUntil).toBeDefined();
    });
  });

  describe("Password History", () => {
    it("should store password history", async () => {
      const passwordHistory = [
        await bcrypt.hash("OldPassword1!", 10),
        await bcrypt.hash("OldPassword2!", 10),
      ];

      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        passwordHistory,
      });

      expect(user.passwordHistory).toHaveLength(2);
    });
  });

  describe("WebAuthn Credentials", () => {
    it("should store WebAuthn credentials", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        webauthnCredentials: [
          {
            credId: "cred-123",
            publicKey: "public-key-123",
            counter: 0,
            transports: ["internal"],
          },
        ],
      });

      expect(user.webauthnCredentials).toHaveLength(1);
      expect(user.webauthnCredentials[0].credId).toBe("cred-123");
    });
  });

  describe("Account Deletion Fields", () => {
    it("should store deletion scheduling", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        deletionRequestedAt: new Date(),
        deletionScheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deletionPending: true,
      });

      expect(user.deletionPending).toBe(true);
      expect(user.deletionScheduledFor).toBeDefined();
    });
  });

  describe("IP Tracking", () => {
    it("should store recent login IPs", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
        recentLoginIPs: [
          {
            ip: "192.168.1.1",
            timestamp: new Date(),
            location: "Manila",
          },
        ],
      });

      expect(user.recentLoginIPs).toHaveLength(1);
      expect(user.recentLoginIPs[0].ip).toBe("192.168.1.1");
    });
  });

  describe("Default Values", () => {
    it("should set default values correctly", async () => {
      const user = await User.create({
        role: businessOwnerRole._id,
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test123!@#", 10),
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
        tokenVersion: 0,
      });

      expect(user.middleName).toBe("");
      expect(user.suffix).toBe("");
      expect(user.phoneNumber).toBe("");
      expect(user.isStaff).toBe(false);
      expect(user.isActive).toBe(true);
      expect(user.mfaEnabled).toBe(false);
      expect(user.failedVerificationAttempts).toBe(0);
      expect(user.tokenVersion).toBe(0);
      expect(user.theme).toBe("default");
    });
  });
});
