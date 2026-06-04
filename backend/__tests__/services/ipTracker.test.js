const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const User = require("../../services/auth-service/src/models/User");
const mongoose = require("mongoose");

// Import the service to test
const ipTracker = require("../../services/auth-service/src/lib/ipTracker");

describe("IP Tracker Service", () => {
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
      role: new mongoose.Types.ObjectId(),
      recentLoginIPs: [],
    });
    testUserId = testUser._id.toString();
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownMongoDB();
  });

  beforeEach(async () => {
    // Clear recent IPs by updating the user directly
    await User.findByIdAndUpdate(testUserId, { recentLoginIPs: [] });
  });

  describe("trackIP", () => {
    it("should track IP address successfully", async () => {
      await ipTracker.trackIP(testUserId, "192.168.1.1", "New York");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("192.168.1.1");
      expect(updatedUser.recentLoginIPs[0].location).toBe("New York");
      expect(updatedUser.recentLoginIPs[0].timestamp).toBeInstanceOf(Date);
    });

    it("should handle missing location", async () => {
      await ipTracker.trackIP(testUserId, "192.168.1.2");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("192.168.1.2");
      expect(updatedUser.recentLoginIPs[0].location).toBe("");
    });

    it("should maintain maximum of 10 recent IPs", async () => {
      // Add 11 IPs
      for (let i = 1; i <= 11; i++) {
        await ipTracker.trackIP(testUserId, `192.168.1.${i}`, `Location ${i}`);
      }

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(10);
      // Should keep the most recent 10 (last 10 added)
      expect(updatedUser.recentLoginIPs[0].ip).toBe("192.168.1.11"); // Most recent
      expect(updatedUser.recentLoginIPs[9].ip).toBe("192.168.1.2"); // 10th most recent
      expect(
        updatedUser.recentLoginIPs.some((ip) => ip.ip === "192.168.1.1"),
      ).toBe(false);
    });

    it("should add new IPs to the beginning", async () => {
      await ipTracker.trackIP(testUserId, "192.168.1.1", "Location 1");
      await ipTracker.trackIP(testUserId, "192.168.1.2", "Location 2");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(2);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("192.168.1.2"); // Most recent first
      expect(updatedUser.recentLoginIPs[1].ip).toBe("192.168.1.1");
    });

    it("should handle non-existent user gracefully", async () => {
      // Should not throw
      await expect(
        ipTracker.trackIP("507f1f77bcf86cd799439999", "192.168.1.1"),
      ).resolves.not.toThrow();
    });

    it("should handle database errors gracefully", async () => {
      // Mock User.findById to throw error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      // Should not throw
      await expect(
        ipTracker.trackIP(testUserId, "192.168.1.1"),
      ).resolves.not.toThrow();

      // Restore original method
      User.findById = originalFindById;
    });
  });

  describe("isUnusualIP", () => {
    beforeEach(async () => {
      // Setup some recent IPs
      await ipTracker.trackIP(testUserId, "192.168.1.1", "New York");
      await ipTracker.trackIP(testUserId, "192.168.1.2", "Los Angeles");
      await ipTracker.trackIP(testUserId, "192.168.1.3", "Chicago");
    });

    it("should return false for IP that matches recent ones", async () => {
      const result = await ipTracker.isUnusualIP(testUserId, "192.168.1.2");

      expect(result.isUnusual).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.recentIPs).toHaveLength(3);
    });

    it("should return true for IP that differs from recent ones", async () => {
      const result = await ipTracker.isUnusualIP(testUserId, "10.0.0.1");

      expect(result.isUnusual).toBe(true);
      expect(result.reason).toBe(
        "IP address differs from recent login locations",
      );
      expect(result.recentIPs).toHaveLength(3);
    });

    it("should return false for user with no IP history", async () => {
      // Clear user's IP history
      await User.findByIdAndUpdate(testUserId, { recentLoginIPs: [] });

      const result = await ipTracker.isUnusualIP(testUserId, "10.0.0.1");

      expect(result.isUnusual).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.recentIPs).toHaveLength(0);
    });

    it("should return false for non-existent user", async () => {
      const result = await ipTracker.isUnusualIP(
        "507f1f77bcf86cd799439999",
        "192.168.1.1",
      );

      expect(result.isUnusual).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.recentIPs).toHaveLength(0);
    });

    it("should only check last 5 IPs for unusual activity", async () => {
      // Add 7 IPs
      for (let i = 1; i <= 7; i++) {
        await ipTracker.trackIP(testUserId, `192.168.1.${i}`, `Location ${i}`);
      }

      // Check against an IP that's in the history but not in the last 5
      const result = await ipTracker.isUnusualIP(testUserId, "192.168.1.1");

      expect(result.isUnusual).toBe(true);
      expect(result.recentIPs).toHaveLength(5); // Should return only last 5 for checking
    });

    it("should handle database errors gracefully", async () => {
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      const result = await ipTracker.isUnusualIP(testUserId, "192.168.1.1");

      expect(result.isUnusual).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.recentIPs).toHaveLength(0);

      User.findById = originalFindById;
    });
  });

  describe("getRecentIPs", () => {
    beforeEach(async () => {
      // Setup some recent IPs
      await ipTracker.trackIP(testUserId, "192.168.1.1", "New York");
      await ipTracker.trackIP(testUserId, "192.168.1.2", "Los Angeles");
      await ipTracker.trackIP(testUserId, "192.168.1.3", "Chicago");
    });

    it("should return recent IPs for user", async () => {
      const recentIPs = await ipTracker.getRecentIPs(testUserId);

      expect(recentIPs).toHaveLength(3);
      expect(recentIPs[0].ip).toBe("192.168.1.3"); // Most recent first
      expect(recentIPs[1].ip).toBe("192.168.1.2");
      expect(recentIPs[2].ip).toBe("192.168.1.1");
      expect(recentIPs[0].location).toBe("Chicago");
    });

    it("should return empty array for user with no IP history", async () => {
      await User.findByIdAndUpdate(testUserId, { recentLoginIPs: [] });

      const recentIPs = await ipTracker.getRecentIPs(testUserId);

      expect(recentIPs).toHaveLength(0);
    });

    it("should return empty array for non-existent user", async () => {
      const recentIPs = await ipTracker.getRecentIPs(
        "507f1f77bcf86cd799439999",
      );

      expect(recentIPs).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      const originalFindById = User.findById;
      const mockFindById = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));
      User.findById = mockFindById;

      const recentIPs = await ipTracker.getRecentIPs(testUserId);

      expect(recentIPs).toHaveLength(0);

      User.findById = originalFindById;
    });

    it("should return lean objects (not Mongoose documents)", async () => {
      const recentIPs = await ipTracker.getRecentIPs(testUserId);

      expect(recentIPs).toHaveLength(3);
      // Should be plain objects, not Mongoose documents
      expect(recentIPs[0]).not.toHaveProperty("_doc");
      expect(recentIPs[0]).not.toHaveProperty("$isModified");
    });
  });

  describe("Edge Cases", () => {
    it("should handle IPv6 addresses", async () => {
      await ipTracker.trackIP(testUserId, "2001:db8::1", "IPv6 Location");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("2001:db8::1");
    });

    it("should handle localhost IPs", async () => {
      await ipTracker.trackIP(testUserId, "127.0.0.1", "Localhost");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("127.0.0.1");
    });

    it("should handle empty IP address", async () => {
      await ipTracker.trackIP(testUserId, "", "Unknown");

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].ip).toBe("");
    });

    it("should handle very long location strings", async () => {
      const longLocation = "A".repeat(1000);
      await ipTracker.trackIP(testUserId, "192.168.1.1", longLocation);

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(1);
      expect(updatedUser.recentLoginIPs[0].location).toBe(longLocation);
    });
  });

  describe("Performance", () => {
    it("should handle multiple concurrent IP tracking", async () => {
      // Clear existing IPs first
      await User.findByIdAndUpdate(testUserId, { recentLoginIPs: [] });

      const promises = [];
      for (let i = 1; i <= 10; i++) {
        promises.push(
          ipTracker.trackIP(testUserId, `192.168.1.${i}`, `Location ${i}`),
        );
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();

      const updatedUser = await User.findById(testUserId);
      expect(updatedUser.recentLoginIPs).toHaveLength(10);
    });

    it("should handle multiple concurrent unusual IP checks", async () => {
      const promises = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(ipTracker.isUnusualIP(testUserId, `10.0.0.${i}`));
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result).toHaveProperty("isUnusual");
        expect(result).toHaveProperty("recentIPs");
      });
    });
  });
});
