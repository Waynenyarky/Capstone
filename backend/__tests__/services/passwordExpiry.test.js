const passwordExpiry = require("../../services/auth-service/src/lib/passwordExpiry");

describe("Password Expiry Service", () => {
  describe("isPasswordExpired", () => {
    it("should return true for null passwordChangedAt", () => {
      expect(passwordExpiry.isPasswordExpired(null)).toBe(true);
      expect(passwordExpiry.isPasswordExpired(undefined)).toBe(true);
    });

    it("should return true for invalid date", () => {
      expect(passwordExpiry.isPasswordExpired("invalid-date")).toBe(true);
      expect(passwordExpiry.isPasswordExpired("")).toBe(true);
    });

    it("should return true for passwords older than 90 days", () => {
      const oldDate = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpired(oldDate)).toBe(true);
    });

    it("should return false for passwords exactly 90 days old", () => {
      const exactly90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpired(exactly90Days)).toBe(false);
    });

    it("should return false for passwords newer than 90 days", () => {
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpired(recentDate)).toBe(false);
    });

    it("should handle string dates", () => {
      const oldDateString = new Date(
        Date.now() - 91 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(passwordExpiry.isPasswordExpired(oldDateString)).toBe(true);
    });

    it("should return false for very recent passwords", () => {
      const today = new Date();
      expect(passwordExpiry.isPasswordExpired(today)).toBe(false);
    });
  });

  describe("isPasswordExpiredByPolicy", () => {
    it("should return false for null passwordChangedAt", () => {
      expect(passwordExpiry.isPasswordExpiredByPolicy(null)).toBe(false);
      expect(passwordExpiry.isPasswordExpiredByPolicy(undefined)).toBe(false);
    });

    it("should return false for invalid date", () => {
      expect(passwordExpiry.isPasswordExpiredByPolicy("invalid-date")).toBe(
        false,
      );
      expect(passwordExpiry.isPasswordExpiredByPolicy("")).toBe(false);
    });

    it("should return true for passwords older than 90 days", () => {
      const oldDate = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpiredByPolicy(oldDate)).toBe(true);
    });

    it("should return false for passwords exactly 90 days old", () => {
      const exactly90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpiredByPolicy(exactly90Days)).toBe(
        false,
      );
    });

    it("should return false for passwords newer than 90 days", () => {
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpiredByPolicy(recentDate)).toBe(false);
    });

    it("should handle string dates", () => {
      const oldDateString = new Date(
        Date.now() - 91 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(passwordExpiry.isPasswordExpiredByPolicy(oldDateString)).toBe(
        true,
      );
    });
  });

  describe("getPasswordExpiryDays", () => {
    it("should return 90 days", () => {
      expect(passwordExpiry.getPasswordExpiryDays()).toBe(90);
    });
  });

  describe("Constants", () => {
    it("should export PASSWORD_EXPIRY_DAYS as 90", () => {
      expect(passwordExpiry.PASSWORD_EXPIRY_DAYS).toBe(90);
    });
  });

  describe("Edge Cases", () => {
    it("should handle Date objects correctly", () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      expect(passwordExpiry.isPasswordExpired(futureDate)).toBe(false);
      expect(passwordExpiry.isPasswordExpiredByPolicy(futureDate)).toBe(false);
    });

    it("should handle epoch timestamp", () => {
      const epoch = new Date(0);
      expect(passwordExpiry.isPasswordExpired(epoch)).toBe(true);
      expect(passwordExpiry.isPasswordExpiredByPolicy(epoch)).toBe(true);
    });

    it("should handle negative timestamps", () => {
      const negativeDate = new Date(-1000);
      expect(passwordExpiry.isPasswordExpired(negativeDate)).toBe(true);
      expect(passwordExpiry.isPasswordExpiredByPolicy(negativeDate)).toBe(true);
    });

    it("should handle very large timestamps", () => {
      const futureDate = new Date(9999999999999);
      expect(passwordExpiry.isPasswordExpired(futureDate)).toBe(false);
      expect(passwordExpiry.isPasswordExpiredByPolicy(futureDate)).toBe(false);
    });
  });

  describe("Behavior Differences", () => {
    it("should show different behavior for null values", () => {
      const nullValue = null;

      // isPasswordExpired treats null as expired (forces password change)
      expect(passwordExpiry.isPasswordExpired(nullValue)).toBe(true);

      // isPasswordExpiredByPolicy treats null as not expired (no 90-day policy message)
      expect(passwordExpiry.isPasswordExpiredByPolicy(nullValue)).toBe(false);
    });

    it("should show same behavior for valid old dates", () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

      // Both should return true for genuinely old passwords
      expect(passwordExpiry.isPasswordExpired(oldDate)).toBe(true);
      expect(passwordExpiry.isPasswordExpiredByPolicy(oldDate)).toBe(true);
    });

    it("should show same behavior for valid recent dates", () => {
      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      // Both should return false for recent passwords
      expect(passwordExpiry.isPasswordExpired(recentDate)).toBe(false);
      expect(passwordExpiry.isPasswordExpiredByPolicy(recentDate)).toBe(false);
    });
  });
});
