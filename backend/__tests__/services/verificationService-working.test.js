const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const User = require("../../services/auth-service/src/models/User");
const mongoose = require("mongoose");

// Import the service to test
const verificationService = require("../../services/auth-service/src/lib/verificationService");

// Mock dependencies
jest.mock("../../services/auth-service/src/lib/codes", () => ({
  generateCode: jest.fn(() => "123456"),
}));

jest.mock("../../services/auth-service/src/lib/mailer", () => ({
  sendOtp: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
}));

jest.mock("../../services/auth-service/src/lib/totp", () => ({
  verifyTotpWithCounter: jest.fn(),
}));

jest.mock("../../services/auth-service/src/lib/secretCipher", () => ({
  decryptWithHash: jest.fn((hash, secret) => secret), // Mock decryption
}));

jest.mock("../../services/auth-service/src/lib/accountLockout", () => ({
  checkLockout: jest.fn().mockResolvedValue({ locked: false }),
  incrementFailedAttempts: jest.fn().mockResolvedValue(),
  clearFailedAttempts: jest.fn().mockResolvedValue(),
}));

jest.mock("../../services/auth-service/src/lib/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logDatabaseQuery: jest.fn(),
}));

describe("Verification Service - Working Version", () => {
  let mongo;
  let testUser;
  let testUserId;

  beforeAll(async () => {
    setupTestEnvironment();
    mongo = await setupMongoDB();

    // Create test user
    testUser = await User.create({
      email: "test@example.com",
      passwordHash: "hashedpassword",
      firstName: "Test",
      lastName: "User",
      role: new mongoose.Types.ObjectId(), // Create a valid ObjectId
      mfaEnabled: false,
      mfaSecret: null,
    });
    testUserId = testUser._id.toString();
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownMongoDB();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear in-memory verification requests
    verificationService.clearVerificationRequest(testUserId);
    verificationService.clearVerificationRequest(testUserId, "email_change");
    verificationService.clearVerificationRequest(testUserId, "password_change");

    // Reset account lockout mocks
    const {
      checkLockout,
      incrementFailedAttempts,
      clearFailedAttempts,
    } = require("../../services/auth-service/src/lib/accountLockout");
    checkLockout.mockResolvedValue({ locked: false });
    incrementFailedAttempts.mockResolvedValue();
    clearFailedAttempts.mockResolvedValue();
  });

  describe("requestVerification", () => {
    it("should request OTP verification successfully", async () => {
      const result = await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe("otp");
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.devCode).toBe("123456"); // Only in non-production
    });

    it("should handle MFA verification request", async () => {
      // Update user to have MFA enabled
      await User.findByIdAndUpdate(testUserId, {
        mfaEnabled: true,
        mfaSecret: "encrypted-secret",
      });

      const result = await verificationService.requestVerification(
        testUserId,
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.method).toBe("mfa");
      expect(result.message).toContain("authenticator app");
    });

    it("should fail when user not found", async () => {
      const result = await verificationService.requestVerification(
        "507f1f77bcf86cd799439999", // Non-existent ID
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should fail when account is locked", async () => {
      const {
        checkLockout,
      } = require("../../services/auth-service/src/lib/accountLockout");
      checkLockout.mockResolvedValue({
        locked: true,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        remainingMinutes: 10,
      });

      const result = await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Account is locked");
      expect(result.lockedUntil).toBeInstanceOf(Date);
      expect(result.remainingMinutes).toBe(10);
    });

    it("should fail when MFA is not enabled", async () => {
      const result = await verificationService.requestVerification(
        testUserId,
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("MFA is not enabled for this account");
    });

    it("should handle email sending failure", async () => {
      const { sendOtp } = require("../../services/auth-service/src/lib/mailer");
      sendOtp.mockRejectedValue(new Error("Email service down"));

      const result = await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to send verification code");
    });

    it("should not include devCode in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result = await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      expect(result.devCode).toBeUndefined();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("verifyCode", () => {
    beforeEach(async () => {
      // Setup a verification request for testing
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );
    });

    it("should verify OTP code successfully", async () => {
      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it("should fail with invalid OTP code", async () => {
      const result = await verificationService.verifyCode(
        testUserId,
        "999999",
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Invalid verification code");
    });

    it("should verify MFA code successfully", async () => {
      // Setup user with MFA
      await User.findByIdAndUpdate(testUserId, {
        mfaEnabled: true,
        mfaSecret: "test-secret",
      });

      const {
        verifyTotpWithCounter,
      } = require("../../services/auth-service/src/lib/totp");
      verifyTotpWithCounter.mockReturnValue({
        ok: true,
        counter: 12345,
      });

      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);

      // Verify user was updated with counter
      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.mfaLastUsedTotpCounter).toBe(12345);
      expect(updatedUser.mfaLastUsedTotpAt).toBeInstanceOf(Date);
    });

    it("should fail MFA verification with invalid code", async () => {
      await User.findByIdAndUpdate(testUserId, {
        mfaEnabled: true,
        mfaSecret: "test-secret",
      });

      const {
        verifyTotpWithCounter,
      } = require("../../services/auth-service/src/lib/totp");
      verifyTotpWithCounter.mockReturnValue({
        ok: false,
      });

      const result = await verificationService.verifyCode(
        testUserId,
        "999999",
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Invalid verification code");
    });

    it("should detect MFA replay attack", async () => {
      await User.findByIdAndUpdate(testUserId, {
        mfaEnabled: true,
        mfaSecret: "test-secret",
        mfaLastUsedTotpCounter: 12345,
      });

      const {
        verifyTotpWithCounter,
      } = require("../../services/auth-service/src/lib/totp");
      verifyTotpWithCounter.mockReturnValue({
        ok: true,
        counter: 12345, // Same as last used
      });

      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("Verification code already used");
    });

    it("should fail when user not found", async () => {
      const result = await verificationService.verifyCode(
        "507f1f77bcf86cd799439999",
        "123456",
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should fail when account is locked", async () => {
      const {
        checkLockout,
      } = require("../../services/auth-service/src/lib/accountLockout");
      checkLockout.mockResolvedValue({
        locked: true,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        remainingMinutes: 10,
      });

      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("Account is locked");
    });

    it("should fail when MFA not enabled", async () => {
      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("MFA is not enabled");
    });

    it("should handle MFA decryption errors", async () => {
      await User.findByIdAndUpdate(testUserId, {
        mfaEnabled: true,
        mfaSecret: "encrypted-secret",
      });

      const {
        decryptWithHash,
      } = require("../../services/auth-service/src/lib/secretCipher");
      decryptWithHash.mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      const result = await verificationService.verifyCode(
        testUserId,
        "123456",
        "mfa",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe("MFA verification failed");
    });
  });

  describe("checkVerificationStatus", () => {
    it("should return pending status for active verification", async () => {
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      const status = await verificationService.checkVerificationStatus(
        testUserId,
        "profile_change",
      );

      expect(status.pending).toBe(true);
      expect(status.expiresAt).toBeInstanceOf(Date);
      expect(status.method).toBe("otp");
    });

    it("should return not pending when no request exists", async () => {
      const status = await verificationService.checkVerificationStatus(
        testUserId,
        "nonexistent_purpose",
      );

      expect(status.pending).toBe(false);
      expect(status.expiresAt).toBeUndefined();
    });

    it("should return not pending when verification completed", async () => {
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );
      await verificationService.verifyCode(
        testUserId,
        "123456",
        "otp",
        "profile_change",
      );

      const status = await verificationService.checkVerificationStatus(
        testUserId,
        "profile_change",
      );

      expect(status.pending).toBe(false);
    });
  });

  describe("clearVerificationRequest", () => {
    it("should clear verification request", async () => {
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      // Verify it exists
      let status = await verificationService.checkVerificationStatus(
        testUserId,
        "profile_change",
      );
      expect(status.pending).toBe(true);

      // Clear it
      verificationService.clearVerificationRequest(
        testUserId,
        "profile_change",
      );

      // Verify it's gone
      status = await verificationService.checkVerificationStatus(
        testUserId,
        "profile_change",
      );
      expect(status.pending).toBe(false);
    });

    it("should handle clearing non-existent request", async () => {
      // Should not throw
      expect(() => {
        verificationService.clearVerificationRequest(
          testUserId,
          "nonexistent_purpose",
        );
      }).not.toThrow();
    });
  });

  describe("Integration with Account Lockout", () => {
    it("should increment failed attempts on invalid verification", async () => {
      const {
        incrementFailedAttempts,
      } = require("../../services/auth-service/src/lib/accountLockout");

      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );
      await verificationService.verifyCode(
        testUserId,
        "999999",
        "otp",
        "profile_change",
      );

      expect(incrementFailedAttempts).toHaveBeenCalledWith(testUserId);
    });

    it("should clear failed attempts on successful verification", async () => {
      const {
        clearFailedAttempts,
      } = require("../../services/auth-service/src/lib/accountLockout");

      await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );
      await verificationService.verifyCode(
        testUserId,
        "123456",
        "otp",
        "profile_change",
      );

      expect(clearFailedAttempts).toHaveBeenCalledWith(testUserId);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Mock User.findById to throw error
      const originalFindById = User.findById;
      User.findById = jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      const result = await verificationService.requestVerification(
        testUserId,
        "otp",
        "profile_change",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original method
      User.findById = originalFindById;
    });
  });

  describe("Security Features", () => {
    it("should handle multiple verification purposes independently", async () => {
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "email_change",
      );
      await verificationService.requestVerification(
        testUserId,
        "otp",
        "password_change",
      );

      // Both should succeed
      const emailStatus = await verificationService.checkVerificationStatus(
        testUserId,
        "email_change",
      );
      const passwordStatus = await verificationService.checkVerificationStatus(
        testUserId,
        "password_change",
      );

      expect(emailStatus.pending).toBe(true);
      expect(passwordStatus.pending).toBe(true);
    });

    it("should handle different purposes correctly", async () => {
      const purposes = ["email_change", "password_change", "profile_change"];
      const { sendOtp } = require("../../services/auth-service/src/lib/mailer");

      for (const purpose of purposes) {
        await verificationService.requestVerification(
          testUserId,
          "otp",
          purpose,
        );

        // Check that sendOtp was called
        expect(sendOtp).toHaveBeenCalled();

        sendOtp.mockClear();
      }
    });
  });
});
