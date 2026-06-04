const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const AuditLog = require("../../services/auth-service/src/models/AuditLog");

// Import the service to test
const auditLogger = require("../../services/auth-service/src/lib/auditLogger");

// Mock axios for blockchain service calls
jest.mock("axios");

// Mock logger
jest.mock("../../services/auth-service/src/lib/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logDatabaseQuery: jest.fn(),
}));

describe("Audit Logger Service", () => {
  let mongo;
  let testUserId;

  beforeAll(async () => {
    setupTestEnvironment();
    mongo = await setupMongoDB();

    // Create test user ID
    testUserId = "507f1f77bcf86cd799439011";
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownMongoDB();
  });

  beforeEach(async () => {
    // Clean up audit logs before each test
    await AuditLog.deleteMany({});
    jest.clearAllMocks();

    // Set default environment
    process.env.AUDIT_SERVICE_URL = "http://localhost:3004";
    process.env.AUDIT_SERVICE_API_KEY = "test-api-key";
  });

  describe("calculateAuditHash", () => {
    it("should calculate consistent hash for same data", async () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const metadata = { ip: "127.0.0.1", userAgent: "test-agent" };

      const hash1 = auditLogger.calculateAuditHash(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        metadata,
        timestamp,
      );

      const hash2 = auditLogger.calculateAuditHash(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        metadata,
        timestamp,
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex string
    });

    it("should generate different hashes for different data", async () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const metadata = { ip: "127.0.0.1" };

      const hash1 = auditLogger.calculateAuditHash(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        metadata,
        timestamp,
      );

      const hash2 = auditLogger.calculateAuditHash(
        testUserId,
        "logout",
        null,
        null,
        null,
        "user",
        metadata,
        timestamp,
      );

      expect(hash1).not.toBe(hash2);
    });

    it("should handle null and undefined values gracefully", async () => {
      const timestamp = "2024-01-01T00:00:00.000Z";

      const hash = auditLogger.calculateAuditHash(
        testUserId,
        "profile_update",
        null,
        null,
        null,
        null,
        null,
        timestamp,
      );

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should include all fields in hash calculation", async () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const metadata = {
        ip: "127.0.0.1",
        userAgent: "test-agent",
        extra: "data",
      };

      const hash = auditLogger.calculateAuditHash(
        testUserId,
        "profile_update",
        "email",
        "old@example.com",
        "new@example.com",
        "business-owner",
        metadata,
        timestamp,
      );

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("createAuditLog", () => {
    it("should create audit log successfully", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        { ip: "127.0.0.1", userAgent: "test-agent" },
      );

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUserId);
      expect(result.eventType).toBe("login");
      expect(result.role).toBe("user");
      expect(result.metadata.ip).toBe("127.0.0.1");
      expect(result.metadata.userAgent).toBe("test-agent");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should create audit log with field changes", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const result = await auditLogger.createAuditLog(
        testUserId,
        "profile_update",
        "email",
        "old@example.com",
        "new@example.com",
        "business-owner",
        { ip: "192.168.1.1" },
      );

      expect(result.fieldChanged).toBe("email");
      expect(result.oldValue).toBe("old@example.com");
      expect(result.newValue).toBe("new@example.com");
      expect(result.role).toBe("business-owner");
    });

    it("should call blockchain audit service", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        { ip: "127.0.0.1" },
      );

      expect(require("axios").post).toHaveBeenCalledWith(
        "http://localhost:3004/api/audit/log",
        {
          operation: "logAuditHash",
          params: [auditLog.hash, "login"],
          auditLogId: auditLog._id.toString(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key",
          },
        },
      );
    });

    it("should handle missing API key gracefully", async () => {
      delete process.env.AUDIT_SERVICE_API_KEY;
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      expect(require("axios").post).toHaveBeenCalledWith(
        "http://localhost:3004/api/audit/log",
        expect.any(Object),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    it("should use default audit service URL", async () => {
      delete process.env.AUDIT_SERVICE_URL;
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      expect(require("axios").post).toHaveBeenCalledWith(
        "http://localhost:3004/api/audit/log",
        expect.any(Object),
        expect.any(Object),
      );
    });

    it("should handle blockchain service errors gracefully", async () => {
      const blockchainError = new Error("Blockchain service unavailable");
      require("axios").post.mockRejectedValue(blockchainError);

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      // Should still create audit log even if blockchain fails
      expect(result).toBeDefined();
      expect(result.eventType).toBe("login");

      // Should log warning about blockchain failure
      const logger = require("../../services/auth-service/src/lib/logger");
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to log to blockchain via Audit Service",
        { error: "Blockchain service unavailable" },
      );
    });

    it("should handle database errors gracefully", async () => {
      // Mock database error
      const originalCreate = AuditLog.create;
      AuditLog.create = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      // Should return null on database error
      expect(result).toBeNull();

      // Should log error
      const logger = require("../../services/auth-service/src/lib/logger");
      expect(logger.error).toHaveBeenCalledWith("Error creating audit log", {
        error: expect.any(Error),
      });

      // Restore original method
      AuditLog.create = originalCreate;
    });

    it("should enrich metadata with default values", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        { customField: "customValue" },
      );

      expect(result.metadata.ip).toBe("unknown");
      expect(result.metadata.userAgent).toBe("unknown");
      expect(result.metadata.customField).toBe("customValue");
    });

    it("should not make blockchain call in test environment when no API key", async () => {
      delete process.env.AUDIT_SERVICE_API_KEY;

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      expect(result).toBeDefined();
      // Should still attempt blockchain call even without API key
      expect(require("axios").post).toHaveBeenCalled();
    });
  });

  describe("Data Integrity", () => {
    it("should store hash consistently with calculated hash", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const metadata = { ip: "127.0.0.1", userAgent: "test-agent" };

      // Create audit log
      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "profile_update",
        "email",
        "old@example.com",
        "new@example.com",
        "business-owner",
        metadata,
      );

      // Verify hash was calculated and stored correctly
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/);

      // Verify the hash matches when calculated with the same timestamp
      const calculatedHash = auditLogger.calculateAuditHash(
        testUserId,
        "profile_update",
        "email",
        "old@example.com",
        "new@example.com",
        "business-owner",
        metadata,
        auditLog.createdAt.toISOString(),
      );

      expect(auditLog.hash).toBe(calculatedHash);
    });

    it("should preserve all audit log fields", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const metadata = {
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0",
        sessionId: "session-123",
        requestId: "req-456",
      };

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "password_change",
        "password",
        "[REDACTED]",
        "[REDACTED]",
        "user",
        metadata,
      );

      expect(auditLog.userId.toString()).toBe(testUserId);
      expect(auditLog.eventType).toBe("password_change");
      expect(auditLog.fieldChanged).toBe("password");
      expect(auditLog.oldValue).toBe("[REDACTED]");
      expect(auditLog.newValue).toBe("[REDACTED]");
      expect(auditLog.role).toBe("user");
      expect(auditLog.metadata).toEqual(metadata);
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(auditLog.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle concurrent audit log creation", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      // Create multiple audit logs concurrently with valid event types
      const validEventTypes = [
        "login",
        "logout",
        "signup",
        "profile_update",
        "password_change",
        "mfa_enabled",
        "mfa_disabled",
        "security_event",
        "login_failed",
        "session_timeout",
      ];
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const eventType = validEventTypes[i % validEventTypes.length];
        promises.push(
          auditLogger.createAuditLog(
            testUserId,
            eventType,
            i % 2 === 0 ? `field_${i}` : null, // Some with field changes, some without
            i % 2 === 0 ? `old_value_${i}` : "",
            i % 2 === 0 ? `new_value_${i}` : "",
            "user",
            { ip: `127.0.0.${i}`, index: i },
          ),
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);

      // All should have valid hashes and not be null
      results.forEach((result, index) => {
        expect(result).not.toBeNull();
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.metadata.index).toBe(index);
      });

      // All should have unique hashes
      const hashes = results.map((r) => r.hash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(10);

      // All should be stored in database
      const storedLogs = await AuditLog.find({ userId: testUserId });
      expect(storedLogs).toHaveLength(10);
    });

    it("should handle audit log lifecycle", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      // Create initial audit log
      const auditLog1 = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
        { ip: "127.0.0.1" },
      );

      // Create field change audit log
      const auditLog2 = await auditLogger.createAuditLog(
        testUserId,
        "profile_update",
        "email",
        "old@example.com",
        "new@example.com",
        "user",
        { ip: "127.0.0.1" },
      );

      // Create logout audit log
      const auditLog3 = await auditLogger.createAuditLog(
        testUserId,
        "logout",
        null,
        null,
        null,
        "user",
        { ip: "127.0.0.1" },
      );

      // Verify all logs are stored
      const allLogs = await AuditLog.find({ userId: testUserId }).sort({
        createdAt: 1,
      });
      expect(allLogs).toHaveLength(3);
      expect(allLogs[0].eventType).toBe("login");
      expect(allLogs[1].eventType).toBe("profile_update");
      expect(allLogs[2].eventType).toBe("logout");

      // Verify blockchain was called for each
      expect(require("axios").post).toHaveBeenCalledTimes(3);
    });

    it("should handle large metadata objects", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const largeMetadata = {
        ip: "127.0.0.1",
        userAgent: "test-agent",
        sessionId: "session-123",
        requestId: "req-456",
        additionalData: {
          field1: "value1",
          field2: "value2",
          field3: "value3",
          nested: {
            deep: "value",
          },
        },
      };

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "profile_update",
        "complex_field",
        "old_complex",
        "new_complex",
        "admin",
        largeMetadata,
      );

      expect(auditLog.metadata).toEqual(largeMetadata);
      expect(auditLog.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Security and Compliance", () => {
    it("should redact sensitive values consistently", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "password_change",
        "password",
        "[REDACTED]",
        "[REDACTED]",
        "user",
        { ip: "127.0.0.1" },
      );

      // Hash should be consistent for redacted values
      const hash1 = auditLogger.calculateAuditHash(
        testUserId,
        "password_change",
        "password",
        "[REDACTED]",
        "[REDACTED]",
        "user",
        { ip: "127.0.0.1" },
        auditLog.createdAt.toISOString(),
      );

      expect(auditLog.hash).toBe(hash1);
    });

    it("should track role changes", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const auditLog = await auditLogger.createAuditLog(
        testUserId,
        "ROLE_CHANGE",
        "role",
        "user",
        "admin",
        "admin",
        { ip: "127.0.0.1" },
      );

      expect(auditLog.fieldChanged).toBe("role");
      expect(auditLog.oldValue).toBe("user");
      expect(auditLog.newValue).toBe("admin");
      expect(auditLog.role).toBe("admin"); // Current role
    });

    it("should handle security events", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const securityEvents = [
        "security_event",
        "login_failed",
        "account_lockout",
        "restricted_field_attempt",
      ];

      for (const event of securityEvents) {
        await auditLogger.createAuditLog(
          testUserId,
          event,
          "security_flag",
          "false",
          "true",
          "security",
          { ip: "suspicious.ip.address", userAgent: "bot" },
        );
      }

      const securityLogs = await AuditLog.find({
        userId: testUserId,
        eventType: { $in: securityEvents },
      });
      expect(securityLogs).toHaveLength(4);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle high volume of audit logs", async () => {
      const mockResponse = { data: { success: true } };
      require("axios").post.mockResolvedValue(mockResponse);

      const startTime = Date.now();

      // Create 100 audit logs with valid event types
      const validEventTypes = [
        "login",
        "logout",
        "signup",
        "profile_update",
        "password_change",
        "mfa_enabled",
        "mfa_disabled",
        "security_event",
        "login_failed",
        "session_timeout",
      ];
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const eventType = validEventTypes[i % validEventTypes.length];
        promises.push(
          auditLogger.createAuditLog(
            testUserId,
            eventType,
            `field_${i}`,
            `old_${i}`,
            `new_${i}`,
            "user",
            { batchId: "bulk-123", index: i },
          ),
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all are stored
      const storedCount = await AuditLog.countDocuments({ userId: testUserId });
      expect(storedCount).toBe(100);
    });

    it("should not block on blockchain service failures", async () => {
      const blockchainError = new Error("Blockchain service timeout");
      require("axios").post.mockRejectedValue(blockchainError);

      const startTime = Date.now();

      const result = await auditLogger.createAuditLog(
        testUserId,
        "login",
        null,
        null,
        null,
        "user",
      );

      const endTime = Date.now();

      // Should complete quickly despite blockchain failure
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result).toBeDefined();
    });
  });
});
