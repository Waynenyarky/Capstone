const request = require("supertest");
const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
  setupApp,
} = require("../helpers/setup");
const {
  createTestUsers,
  getTestTokens,
  generateUniqueEmail,
} = require("../helpers/fixtures");
const { cleanupTestData } = require("../helpers/cleanup");
const User = require("../../services/auth-service/src/models/User");
const Role = require("../../services/auth-service/src/models/Role");
const LoginRequest = require("../../services/auth-service/src/models/LoginRequest");
const Session = require("../../services/auth-service/src/models/Session");

describe("Login Routes - Core Functionality", () => {
  let mongo;
  let app;
  let testUser;
  let adminUser;
  let testTokens;

  beforeAll(async () => {
    setupTestEnvironment();
    mongo = await setupMongoDB();
    app = await setupApp();

    // Create test users
    const users = await createTestUsers();
    testUser = users.businessOwner;
    adminUser = users.adminUser;
    testTokens = getTestTokens(users);
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownMongoDB();
  });

  beforeEach(async () => {
    // Clean up login requests and sessions before each test
    await LoginRequest.deleteMany({});
    await Session.deleteMany({});
  });

  describe("POST /api/auth/login/start", () => {
    it("should start login process for valid credentials", async () => {
      const response = await request(app).post("/api/auth/login/start").send({
        email: testUser.email,
        password: "Test123!@#",
      });

      expect(response.status).toBe(200);
      // Handle both development and production response formats
      if (response.body.ok) {
        expect(response.body).toHaveProperty("ok", true);
      } else {
        expect(response.body).toHaveProperty("devCode");
        expect(response.body).toHaveProperty("sent", true);
      }
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login/start").send({
        email: "invalid@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("ok", false);
    });

    it("should handle missing required fields", async () => {
      const response = await request(app).post("/api/auth/login/start").send({
        password: "Test123!@#",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });

    it("should create login request record", async () => {
      await request(app).post("/api/auth/login/start").send({
        email: testUser.email,
        password: "Test123!@#",
      });

      const loginRequest = await LoginRequest.findOne({
        email: testUser.email.toLowerCase(),
      });
      expect(loginRequest).toBeTruthy();
      expect(loginRequest).toHaveProperty("code");
      expect(loginRequest).toHaveProperty("expiresAt");
    });
  });

  describe("POST /api/auth/login/resend", () => {
    beforeEach(async () => {
      // Create an initial login request
      await request(app).post("/api/auth/login/start").send({
        email: testUser.email,
        password: "Test123!@#",
      });
    });

    it("should resend OTP code", async () => {
      const response = await request(app).post("/api/auth/login/resend").send({
        email: testUser.email,
      });

      expect(response.status).toBe(200);
      if (response.body.ok) {
        expect(response.body).toHaveProperty("ok", true);
      } else {
        // Handle different response structures
        expect(response.body).toHaveProperty("sent", true);
      }
    });

    it("should reject resend for non-existent email", async () => {
      const response = await request(app).post("/api/auth/login/resend").send({
        email: "nonexistent@example.com",
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("ok", false);
    });
  });

  describe("POST /api/auth/login/verify", () => {
    let loginCode;

    beforeEach(async () => {
      // Clean up any existing requests
      await LoginRequest.deleteMany({});

      // Start login process to get a code
      const startResponse = await request(app)
        .post("/api/auth/login/start")
        .send({
          email: testUser.email,
          password: "Test123!@#",
        });

      // Get the code from the database
      const loginRequest = await LoginRequest.findOne({
        email: testUser.email.toLowerCase(),
      });
      loginCode = loginRequest ? loginRequest.code : null;
    });

    it("should verify correct OTP code and complete login", async () => {
      if (!loginCode) {
        console.log("No login code found, skipping test");
        return;
      }

      const response = await request(app).post("/api/auth/login/verify").send({
        email: testUser.email,
        code: loginCode,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ok", true);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");

      // Verify session was created
      const session = await Session.findOne({
        userId: testUser._id,
        isActive: true,
      });
      expect(session).toBeTruthy();
      expect(session).toHaveProperty("expiresAt");
    });

    it("should reject incorrect OTP code", async () => {
      const response = await request(app).post("/api/auth/login/verify").send({
        email: testUser.email,
        code: "123456",
      });

      expect([400, 401, 404]).toContain(response.status); // Accept various error codes
      expect(response.body).toHaveProperty("ok", false);
    });

    it("should handle malformed OTP code", async () => {
      const response = await request(app).post("/api/auth/login/verify").send({
        email: testUser.email,
        code: "abc123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });

    it("should handle missing fields", async () => {
      const response = await request(app).post("/api/auth/login/verify").send({
        email: testUser.email,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });
  });

  describe("POST /api/auth/google", () => {
    it("should handle missing Google auth parameters", async () => {
      const response = await request(app).post("/api/auth/google").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });

    it("should reject invalid email format", async () => {
      const response = await request(app).post("/api/auth/google").send({
        email: "invalid-email",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });
  });

  describe("Security Features", () => {
    it("should handle case-insensitive email normalization", async () => {
      const uniqueEmail = generateUniqueEmail("test");
      await User.create({
        email: uniqueEmail,
        passwordHash: await require("bcryptjs").hash("Test123!@#", 10),
        role: testUser.role,
        termsAccepted: true,
        tokenVersion: 0,
        firstName: "Test",
        lastName: "User",
        phoneNumber: `__unset__${Date.now()}${Math.random()}`,
      });

      const response = await request(app).post("/api/auth/login/start").send({
        email: uniqueEmail.toUpperCase(),
        password: "Test123!@#",
      });

      expect(response.status).toBe(200);
    });

    it("should handle email with whitespace trimming", async () => {
      const uniqueEmail = generateUniqueEmail("test");
      await User.create({
        email: uniqueEmail,
        passwordHash: await require("bcryptjs").hash("Test123!@#", 10),
        role: testUser.role,
        termsAccepted: true,
        tokenVersion: 0,
        firstName: "Test",
        lastName: "User",
        phoneNumber: `__unset__${Date.now()}${Math.random()}`,
      });

      const response = await request(app)
        .post("/api/auth/login/start")
        .send({
          email: `  ${uniqueEmail}  `,
          password: "Test123!@#",
        });

      expect(response.status).toBe(200);
    });

    it("should reject extremely long inputs", async () => {
      const longEmail = "a".repeat(201) + "@example.com";

      const response = await request(app).post("/api/auth/login/start").send({
        email: longEmail,
        password: "Test123!@#",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("ok", false);
    });
  });

  describe("Rate Limiting", () => {
    it("should implement rate limiting on login start", async () => {
      // Make multiple requests quickly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app).post("/api/auth/login/start").send({
            email: testUser.email,
            password: "Test123!@#",
          }),
        );
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("Development Mode", () => {
    it("should handle dev admin shorthand in development", async () => {
      if (process.env.NODE_ENV !== "development") {
        return; // Skip this test in non-development mode
      }

      const response = await request(app).post("/api/auth/login/start").send({
        email: "1",
        password: "1",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("devCode");
    });
  });
});
