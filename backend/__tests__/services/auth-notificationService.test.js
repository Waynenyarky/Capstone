const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const Notification = require("../../services/auth-service/src/models/Notification");

// Import the service to test
const notificationService = require("../../services/auth-service/src/services/notificationService");

// Mock vi for Jest compatibility
const vi = {
  fn: () => jest.fn(),
  mockRejectedValue: (error) => jest.fn().mockRejectedValue(error),
};

describe("Auth Notification Service", () => {
  let mongo;
  let testUserId;
  let testNotifications;

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
    // Clean up notifications before each test
    await Notification.deleteMany({});
  });

  describe("createNotification", () => {
    it("should create a notification successfully", async () => {
      const notificationData = {
        type: "general",
        title: "Test Notification",
        message: "This is a test notification",
        relatedEntityType: "system",
        relatedEntityId: testUserId,
        metadata: { source: "test" },
      };

      const result = await notificationService.createNotification(
        testUserId,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.relatedEntityType,
        notificationData.relatedEntityId,
        notificationData.metadata,
      );

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUserId);
      expect(result.type).toBe(notificationData.type);
      expect(result.title).toBe(notificationData.title);
      expect(result.message).toBe(notificationData.message);
      expect(result.read).toBe(false);
      expect(result.relatedEntityType).toBe(notificationData.relatedEntityType);
      expect(result.relatedEntityId).toBe(notificationData.relatedEntityId);
      expect(result.metadata).toEqual(notificationData.metadata);
    });

    it("should create notification with minimal parameters", async () => {
      const result = await notificationService.createNotification(
        testUserId,
        "general",
        "Simple Test",
        "Simple message",
      );

      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUserId);
      expect(result.type).toBe("general");
      expect(result.title).toBe("Simple Test");
      expect(result.message).toBe("Simple message");
      expect(result.read).toBe(false);
      expect(result.relatedEntityType).toBeNull();
      expect(result.relatedEntityId).toBeNull();
      expect(result.metadata).toEqual({});
    });

    it("should throw error when userId is invalid", async () => {
      await expect(
        notificationService.createNotification(
          null,
          "general",
          "Test",
          "Message",
        ),
      ).rejects.toThrow("Failed to create notification");
    });

    it("should throw error when required fields are missing", async () => {
      await expect(
        notificationService.createNotification(
          testUserId,
          "", // Empty type
          "Test",
          "Message",
        ),
      ).rejects.toThrow("Failed to create notification");
    });
  });

  describe("getUserNotifications", () => {
    beforeEach(async () => {
      // Create test notifications
      testNotifications = await Notification.create([
        {
          userId: testUserId,
          type: "general",
          title: "Notification 1",
          message: "Message 1",
          read: false,
          createdAt: new Date(),
        },
        {
          userId: testUserId,
          type: "system_alert",
          title: "Notification 2",
          message: "Message 2",
          read: true,
          createdAt: new Date(),
        },
        {
          userId: testUserId,
          type: "security_alert",
          title: "Notification 3",
          message: "Message 3",
          read: false,
          createdAt: new Date(),
        },
      ]);
    });

    it("should get user notifications with pagination", async () => {
      const result = await notificationService.getUserNotifications(
        testUserId,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(result.notifications).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should get only unread notifications", async () => {
      const result = await notificationService.getUserNotifications(
        testUserId,
        {
          unreadOnly: true,
        },
      );

      expect(result.notifications).toHaveLength(2);
      expect(result.notifications.every((n) => n.read === false)).toBe(true);
    });

    it("should paginate results correctly", async () => {
      const result = await notificationService.getUserNotifications(
        testUserId,
        {
          page: 1,
          limit: 2,
        },
      );

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should sort notifications by creation date descending", async () => {
      const result = await notificationService.getUserNotifications(testUserId);

      expect(result.notifications).toHaveLength(3);
      // Should be sorted by createdAt descending
      for (let i = 1; i < result.notifications.length; i++) {
        const prevDate = new Date(result.notifications[i - 1].createdAt);
        const currentDate = new Date(result.notifications[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(
          currentDate.getTime(),
        );
      }
    });

    it("should return empty result for user with no notifications", async () => {
      const otherUserId = "507f1f77bcf86cd799439012";
      const result =
        await notificationService.getUserNotifications(otherUserId);

      expect(result.notifications).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    beforeEach(async () => {
      await Notification.create([
        {
          userId: testUserId,
          type: "general",
          title: "Unread 1",
          message: "Message 1",
          read: false,
          createdAt: new Date(),
        },
        {
          userId: testUserId,
          type: "system_alert",
          title: "Read 1",
          message: "Message 2",
          read: true,
          createdAt: new Date(),
        },
        {
          userId: testUserId,
          type: "security_alert",
          title: "Unread 2",
          message: "Message 3",
          read: false,
          createdAt: new Date(),
        },
      ]);
    });

    it("should return correct unread count", async () => {
      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(2);
    });

    it("should return 0 for user with no unread notifications", async () => {
      await Notification.updateMany({ userId: testUserId }, { read: true });

      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(0);
    });

    it("should return 0 for user with no notifications", async () => {
      const otherUserId = "507f1f77bcf86cd799439012";
      const count = await notificationService.getUnreadCount(otherUserId);
      expect(count).toBe(0);
    });
  });

  describe("markAsRead", () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        userId: testUserId,
        type: "general",
        title: "Test Notification",
        message: "Test message",
        read: false,
      });
    });

    it("should mark notification as read", async () => {
      const result = await notificationService.markAsRead(
        testNotification._id,
        testUserId,
      );

      expect(result.read).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it("should throw error for non-existent notification", async () => {
      const fakeId = "507f1f77bcf86cd799439012";

      await expect(
        notificationService.markAsRead(fakeId, testUserId),
      ).rejects.toThrow("Notification not found or access denied");
    });

    it("should throw error when trying to mark another user's notification", async () => {
      const otherUserId = "507f1f77bcf86cd799439012";

      await expect(
        notificationService.markAsRead(testNotification._id, otherUserId),
      ).rejects.toThrow("Notification not found or access denied");
    });
  });

  describe("markAllAsRead", () => {
    beforeEach(async () => {
      await Notification.create([
        {
          userId: testUserId,
          type: "general",
          title: "Unread 1",
          message: "Message 1",
          read: false,
        },
        {
          userId: testUserId,
          type: "system_alert",
          title: "Unread 2",
          message: "Message 2",
          read: false,
        },
        {
          userId: testUserId,
          type: "security_alert",
          title: "Read 1",
          message: "Message 3",
          read: true,
        },
      ]);
    });

    it("should mark all unread notifications as read", async () => {
      const result = await notificationService.markAllAsRead(testUserId);

      expect(result.modifiedCount).toBe(2);

      const unreadCount = await notificationService.getUnreadCount(testUserId);
      expect(unreadCount).toBe(0);
    });

    it("should return 0 modified when no unread notifications exist", async () => {
      await Notification.updateMany({ userId: testUserId }, { read: true });

      const result = await notificationService.markAllAsRead(testUserId);
      expect(result.modifiedCount).toBe(0);
    });
  });

  describe("deleteNotification", () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        userId: testUserId,
        type: "general",
        title: "Test Notification",
        message: "Test message",
        read: false,
      });
    });

    it("should delete notification successfully", async () => {
      const result = await notificationService.deleteNotification(
        testNotification._id,
        testUserId,
      );

      expect(result._id.toString()).toBe(testNotification._id.toString());

      const deletedNotification = await Notification.findById(
        testNotification._id,
      );
      expect(deletedNotification).toBeNull();
    });

    it("should throw error for non-existent notification", async () => {
      const fakeId = "507f1f77bcf86cd799439012";

      await expect(
        notificationService.deleteNotification(fakeId, testUserId),
      ).rejects.toThrow("Notification not found or access denied");
    });

    it("should throw error when trying to delete another user's notification", async () => {
      const otherUserId = "507f1f77bcf86cd799439012";

      await expect(
        notificationService.deleteNotification(
          testNotification._id,
          otherUserId,
        ),
      ).rejects.toThrow("Notification not found or access denied");
    });
  });

  describe("deleteAllForUser", () => {
    beforeEach(async () => {
      await Notification.create([
        {
          userId: testUserId,
          type: "general",
          title: "Notification 1",
          message: "Message 1",
        },
        {
          userId: testUserId,
          type: "system_alert",
          title: "Notification 2",
          message: "Message 2",
        },
        {
          userId: "507f1f77bcf86cd799439012",
          type: "security_alert",
          title: "Other User Notification",
          message: "Other message",
        },
      ]);
    });

    it("should delete all notifications for user", async () => {
      const result = await notificationService.deleteAllForUser(testUserId);

      expect(result.deletedCount).toBe(2);

      const remainingNotifications = await Notification.find({
        userId: testUserId,
      });
      expect(remainingNotifications).toHaveLength(0);
    });

    it("should not affect other users' notifications", async () => {
      await notificationService.deleteAllForUser(testUserId);

      const otherUserNotifications = await Notification.find({
        userId: "507f1f77bcf86cd799439012",
      });
      expect(otherUserNotifications).toHaveLength(1);
    });
  });

  describe("deleteNotificationsOlderThan", () => {
    beforeEach(async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

      await Notification.create([
        {
          userId: testUserId,
          type: "general",
          title: "Old Notification",
          message: "Old message",
          createdAt: oldDate,
        },
        {
          userId: testUserId,
          type: "system_alert",
          title: "Recent Notification",
          message: "Recent message",
          createdAt: recentDate,
        },
      ]);
    });

    it("should delete notifications older than specified days", async () => {
      const result = await notificationService.deleteNotificationsOlderThan(
        testUserId,
        7,
      );

      expect(result.deletedCount).toBe(1);

      const remainingNotifications = await Notification.find({
        userId: testUserId,
      });
      expect(remainingNotifications).toHaveLength(1);
      expect(remainingNotifications[0].title).toBe("Recent Notification");
    });

    it("should use default 7 days when no days specified", async () => {
      const result =
        await notificationService.deleteNotificationsOlderThan(testUserId);

      expect(result.deletedCount).toBe(1);
    });

    it("should delete all when all notifications are old", async () => {
      const result = await notificationService.deleteNotificationsOlderThan(
        testUserId,
        1,
      );

      expect(result.deletedCount).toBe(2);

      const remainingNotifications = await Notification.find({
        userId: testUserId,
      });
      expect(remainingNotifications).toHaveLength(0);
    });
  });

  describe("Automatic Cleanup in getUserNotifications", () => {
    beforeEach(async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      await Notification.create({
        userId: testUserId,
        type: "general",
        title: "Old Notification",
        message: "Old message",
        createdAt: oldDate,
      });
    });

    it("should automatically delete old notifications when fetching", async () => {
      const result = await notificationService.getUserNotifications(testUserId);

      expect(result.notifications).toHaveLength(0);
      expect(result.pagination.total).toBe(0);

      const oldNotifications = await Notification.find({ userId: testUserId });
      expect(oldNotifications).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors gracefully", async () => {
      // Mock a database error by temporarily closing connection
      const originalCreate = Notification.create;
      Notification.create = vi
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      await expect(
        notificationService.createNotification(
          testUserId,
          "general",
          "Test",
          "Message",
        ),
      ).rejects.toThrow("Failed to create notification");

      // Restore original method
      Notification.create = originalCreate;
    });

    it("should handle invalid ObjectId format", async () => {
      const invalidId = "invalid-object-id";

      await expect(
        notificationService.markAsRead(invalidId, testUserId),
      ).rejects.toThrow("Failed to mark notification as read");
    });

    it("should handle malformed query options", async () => {
      const result = await notificationService.getUserNotifications(
        testUserId,
        {
          page: -1, // Invalid page number
          limit: 0, // Invalid limit
        },
      );

      expect(result.notifications).toHaveLength(0);
      expect(result.pagination.page).toBe(-1);
      expect(result.pagination.limit).toBe(0);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle notification lifecycle workflow", async () => {
      // Create notification
      const notification = await notificationService.createNotification(
        testUserId,
        "general",
        "Workflow Test",
        "Testing complete workflow",
      );

      expect(notification.read).toBe(false);

      // Check unread count
      const unreadCount = await notificationService.getUnreadCount(testUserId);
      expect(unreadCount).toBe(1);

      // Get notifications
      const notifications =
        await notificationService.getUserNotifications(testUserId);
      expect(notifications.notifications).toHaveLength(1);

      // Mark as read
      const markedNotification = await notificationService.markAsRead(
        notification._id,
        testUserId,
      );
      expect(markedNotification.read).toBe(true);

      // Check unread count again
      const newUnreadCount =
        await notificationService.getUnreadCount(testUserId);
      expect(newUnreadCount).toBe(0);

      // Delete notification
      await notificationService.deleteNotification(
        notification._id,
        testUserId,
      );

      const finalNotifications =
        await notificationService.getUserNotifications(testUserId);
      expect(finalNotifications.notifications).toHaveLength(0);
    });

    it("should handle bulk operations correctly", async () => {
      // Create multiple notifications
      const notifications = [];
      for (let i = 0; i < 5; i++) {
        notifications.push(
          await notificationService.createNotification(
            testUserId,
            "general",
            `Bulk Test ${i}`,
            `Message ${i}`,
          ),
        );
      }

      expect(notifications).toHaveLength(5);

      // Check unread count
      const unreadCount = await notificationService.getUnreadCount(testUserId);
      expect(unreadCount).toBe(5);

      // Mark all as read
      const markAllResult = await notificationService.markAllAsRead(testUserId);
      expect(markAllResult.modifiedCount).toBe(5);

      // Check unread count after marking all as read
      const newUnreadCount =
        await notificationService.getUnreadCount(testUserId);
      expect(newUnreadCount).toBe(0);

      // Delete all for user
      const deleteAllResult =
        await notificationService.deleteAllForUser(testUserId);
      expect(deleteAllResult.deletedCount).toBe(5);

      // Verify all deleted
      const finalNotifications =
        await notificationService.getUserNotifications(testUserId);
      expect(finalNotifications.notifications).toHaveLength(0);
    });

    it("should handle concurrent operations safely", async () => {
      // Create multiple notifications concurrently
      const createPromises = [];
      for (let i = 0; i < 10; i++) {
        createPromises.push(
          notificationService.createNotification(
            testUserId,
            "general",
            `Concurrent ${i}`,
            `Message ${i}`,
          ),
        );
      }

      const createdNotifications = await Promise.all(createPromises);
      expect(createdNotifications).toHaveLength(10);

      // Mark all as read concurrently
      const markPromises = createdNotifications.map((notification) =>
        notificationService.markAsRead(notification._id, testUserId),
      );

      const markedNotifications = await Promise.all(markPromises);
      expect(markedNotifications.every((n) => n.read === true)).toBe(true);

      // Delete all concurrently
      const deletePromises = createdNotifications.map((notification) =>
        notificationService.deleteNotification(notification._id, testUserId),
      );

      const deletedResults = await Promise.all(deletePromises);
      expect(deletedResults).toHaveLength(10);

      // Verify all deleted
      const finalNotifications =
        await notificationService.getUserNotifications(testUserId);
      expect(finalNotifications.notifications).toHaveLength(0);
    });
  });
});
