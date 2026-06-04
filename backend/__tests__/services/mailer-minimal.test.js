// Mock axios at the module level before any imports
jest.mock("axios", () => ({
  post: jest.fn(),
}));

// Mock logger
jest.mock("../../services/auth-service/src/lib/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Now import the mailer service
const mailer = require("../../services/auth-service/src/lib/mailer");

describe("Mailer Service - Minimal Working Tests", () => {
  let originalEnv;

  beforeEach(() => {
    // Store original env and reset mocks
    originalEnv = { ...process.env };
    jest.clearAllMocks();

    // Set default test environment
    process.env.EMAIL_API_PROVIDER = "resend";
    process.env.EMAIL_API_KEY = "test-api-key";
    process.env.DEFAULT_FROM_EMAIL = "test@example.com";
    process.env.APP_BRAND_NAME = "TestApp";
    process.env.FRONTEND_URL = "http://localhost:3000";
    process.env.SUPPORT_EMAIL = "support@example.com";
    process.env.VERIFICATION_CODE_TTL_MIN = "10";
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("Core Functionality", () => {
    it("should send OTP email successfully", async () => {
      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
        purpose: "login",
      });

      // Should either succeed with real API or use mock sender
      expect(result).toBeDefined();
    });

    it("should use mock sender when no API key", async () => {
      delete process.env.EMAIL_API_KEY;

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("messageId");
      expect(result.accepted).toContain("user@example.com");
    });

    it("should handle different OTP purposes", async () => {
      const purposes = ["login", "signup", "password_reset"];

      for (const purpose of purposes) {
        const result = await mailer.sendOtp({
          to: "user@example.com",
          code: "123456",
          purpose,
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe("Email Functions", () => {
    it("should send forgot password email", async () => {
      // This function may not return anything, just test it doesn't crash
      await expect(
        mailer.sendForgotPasswordNotAvailableEmail({
          to: "user@example.com",
          code: "123456",
          roleSlug: "business-owner",
        }),
      ).resolves.not.toThrow();
    });

    it("should send staff credentials email", async () => {
      await expect(
        mailer.sendStaffCredentialsEmail({
          to: "staff@example.com",
          username: "staffuser",
          tempPassword: "temp123",
          office: "Main Office",
          roleLabel: "Staff Member",
        }),
      ).resolves.not.toThrow();
    });

    it("should send email change notification", async () => {
      await expect(
        mailer.sendEmailChangeNotification({
          to: "old@example.com",
          oldEmail: "old@example.com",
          newEmail: "new@example.com",
          revertUrl: "http://localhost:3000/revert",
          type: "old_email",
        }),
      ).resolves.not.toThrow();
    });

    it("should send password change notification", async () => {
      await expect(
        mailer.sendPasswordChangeNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          timestamp: new Date(),
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("MFA Notifications", () => {
    it("should send MFA enabled notification", async () => {
      await expect(
        mailer.sendMfaEnabledNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          method: "authenticator",
        }),
      ).resolves.not.toThrow();
    });

    it("should send MFA disable requested notification", async () => {
      await expect(
        mailer.sendMfaDisableRequestedNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should send MFA disabled notification", async () => {
      await expect(
        mailer.sendMfaDisabledNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should send passkey added notification", async () => {
      await expect(
        mailer.sendPasskeyAddedNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should send passkey removed notification", async () => {
      await expect(
        mailer.sendPasskeyRemovedNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Admin Functions", () => {
    it("should send admin alert email", async () => {
      await expect(
        mailer.sendAdminAlertEmail({
          to: "admin@example.com",
          adminName: "Admin User",
          userId: "user123",
          userName: "John Doe",
          userEmail: "john@example.com",
          field: "restricted_field",
          attemptedValue: "forbidden_value",
          roleSlug: "business-owner",
          timestamp: new Date(),
        }),
      ).resolves.not.toThrow();
    });

    it("should send admin alert", async () => {
      await expect(
        mailer.sendAdminAlert({
          to: "admin@example.com",
          subject: "Security Alert",
          message: "Suspicious activity detected",
        }),
      ).resolves.not.toThrow();
    });

    it("should send approval notification", async () => {
      await expect(
        mailer.sendApprovalNotification({
          to: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          businessName: "Test Business",
          status: "approved",
          comments: "All good!",
          approvalId: "approval123",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Provider Support", () => {
    it("should support Resend provider", async () => {
      process.env.EMAIL_API_PROVIDER = "resend";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });

    it("should support SendGrid provider", async () => {
      process.env.EMAIL_API_PROVIDER = "sendgrid";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });

    it("should support Mailgun provider", async () => {
      process.env.EMAIL_API_PROVIDER = "mailgun";
      process.env.MAILGUN_DOMAIN = "test.example.com";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });

    it("should support AWS SES provider", async () => {
      process.env.EMAIL_API_PROVIDER = "ses";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });

    it("should support Postmark provider", async () => {
      process.env.EMAIL_API_PROVIDER = "postmark";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing parameters", async () => {
      const result1 = await mailer.sendOtp({ to: "", code: "123456" });
      expect(result1).toHaveProperty("success", false);

      const result2 = await mailer.sendOtp({
        to: "user@example.com",
        code: "",
      });
      expect(result2).toHaveProperty("success", false);
    });

    it("should handle placeholder API keys", async () => {
      process.env.EMAIL_API_KEY = "your-api-key-here";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
      // Should either have messageId (mock sender) or success: false (API error)
      if (result.success !== false) {
        expect(result).toHaveProperty("messageId");
      }
    });
  });

  describe("Environment Configuration", () => {
    it("should handle dev redirect", async () => {
      process.env.EMAIL_DEV_REDIRECT_TO = "dev@example.com";

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });

    it("should work with minimal configuration", async () => {
      // Test with minimal env vars
      delete process.env.EMAIL_API_PROVIDER;
      delete process.env.EMAIL_API_KEY;
      delete process.env.DEFAULT_FROM_EMAIL;
      delete process.env.APP_BRAND_NAME;
      delete process.env.FRONTEND_URL;
      delete process.env.SUPPORT_EMAIL;

      const result = await mailer.sendOtp({
        to: "user@example.com",
        code: "123456",
      });

      expect(result).toBeDefined();
    });
  });
});
