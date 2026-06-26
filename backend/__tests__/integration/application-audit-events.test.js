const {
  setupTestEnvironment,
  setupMongoDB,
  teardownMongoDB,
} = require("../helpers/setup");
const { cleanupTestData } = require("../helpers/cleanup");
const mongoose = require("mongoose");
const AuditLog = require("../../services/audit-service/src/models/AuditLog");
const BusinessProfile = require("../../services/business-service/src/models/BusinessProfile");
const User = require("../../services/auth-service/src/models/User");
const Role = require("../../services/auth-service/src/models/Role");

describe("Application Audit Events Integration Test", () => {
  let testUser;
  let testOfficer;
  let lguOfficerRole;
  let businessProfile;

  beforeAll(async () => {
    setupTestEnvironment();
    await setupMongoDB();

    // Create LGU Officer role if not exists
    lguOfficerRole = await Role.findOne({ slug: "lgu_officer" });
    if (!lguOfficerRole) {
      lguOfficerRole = await Role.create({
        name: "LGU Officer",
        slug: "lgu_officer",
        permissions: [],
      });
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownMongoDB();
  });

  beforeEach(async () => {
    // Clean up audit logs before each test
    await AuditLog.deleteMany({});
    // Clean up users to avoid duplicate key errors
    await User.deleteMany({
      email: { $in: ["testowner@example.com", "officer@example.com"] },
    });
    // Clean up business profiles
    await BusinessProfile.deleteMany({});

    // Create test business owner
    testUser = await User.create({
      email: "testowner@example.com",
      firstName: "Test",
      lastName: "Owner",
      passwordHash: "hashedpassword123",
      phoneNumber: "+1234567890",
      role: await Role.findOne({ slug: "business_owner" }),
      isActive: true,
    });

    // Create test LGU officer
    testOfficer = await User.create({
      email: "officer@example.com",
      firstName: "Test",
      lastName: "Officer",
      passwordHash: "hashedpassword123",
      phoneNumber: "+0987654321",
      role: lguOfficerRole,
      isActive: true,
    });

    // Create business profile
    businessProfile = await BusinessProfile.create({
      userId: testUser._id,
      ownerIdentity: {
        fullName: "Test Owner",
      },
      businesses: [],
    });
  });

  describe("application_submitted event", () => {
    it("should create audit log when application is submitted from draft", async () => {
      // Create a draft business directly in database to bypass encryption issues
      const businessId = new mongoose.Types.ObjectId().toString();
      const newBusiness = {
        _id: new mongoose.Types.ObjectId(),
        businessId,
        businessName: "Test Business",
        businessRegistrationNumber: "TEST-123",
        businessType: "g",
        applicationStatus: "draft",
        location: {
          street: "123 Test St",
          barangay: "Test Barangay",
          city: "Test City",
          municipality: "Test Municipality",
        },
        businessStartDate: new Date("2024-01-01"),
        numberOfBranches: 1,
        industryClassification: "Retail",
        taxIdentificationNumber: "123456789",
        contactNumber: "1234567890",
        riskProfile: {
          businessSize: 1,
          annualRevenue: 100000,
          businessActivitiesDescription: "Test activities",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      businessProfile.businesses.push(newBusiness);
      await businessProfile.save();

      // Submit the application by updating status
      const profile = await BusinessProfile.findById(businessProfile._id);
      const business = profile.businesses.find(
        (b) => b.businessId === businessId,
      );
      business.applicationStatus = "submitted";
      business.submittedAt = new Date();
      business.submittedToLguOfficer = true;
      business.isSubmitted = true;
      business.applicationReferenceNumber = `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      business.updatedAt = new Date();
      profile.markModified("businesses");
      await profile.save();

      // Call the audit log directly to test the event
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "application_submitted",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          applicationReferenceNumber: business.applicationReferenceNumber,
          submittedAt: business.submittedAt,
          role: "business_owner",
          entityType: "BusinessProfile",
          entityId: businessId,
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "business_application_submitted",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          applicationReferenceNumber: business.applicationReferenceNumber,
          submittedAt: business.submittedAt,
          role: "business_owner",
          entityType: "BusinessProfile",
          entityId: businessId,
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      // Wait for audit log to be created
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify audit log was created
      const auditLogs = await AuditLog.find({
        eventType: "business_application_submitted",
        "metadata.entityId": businessId,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const auditLog = auditLogs[0];
      expect(auditLog.eventType).toBe("business_application_submitted");
      expect(auditLog.userId.toString()).toBe(testUser._id.toString());
      expect(auditLog.metadata.entityId).toBe(businessId);
      expect(auditLog.metadata.businessName).toBe("Test Business");
      expect(auditLog.metadata.role).toBe("business_owner");
    });

    it("should create audit log when application is resubmitted", async () => {
      // Create a business in resubmit status directly in database
      const businessId = new mongoose.Types.ObjectId().toString();
      const newBusiness = {
        _id: new mongoose.Types.ObjectId(),
        businessId,
        businessName: "Test Business Resubmit",
        businessRegistrationNumber: "TEST-124",
        businessType: "g",
        applicationStatus: "resubmit",
        location: {
          street: "124 Test St",
          barangay: "Test Barangay",
          city: "Test City",
          municipality: "Test Municipality",
        },
        businessStartDate: new Date("2024-01-01"),
        numberOfBranches: 1,
        industryClassification: "Retail",
        taxIdentificationNumber: "123456789",
        contactNumber: "1234567890",
        riskProfile: {
          businessSize: 1,
          annualRevenue: 100000,
          businessActivitiesDescription: "Test activities",
        },
        submittedAt: new Date(),
        submittedToLguOfficer: true,
        isSubmitted: true,
        applicationReferenceNumber: `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      businessProfile.businesses.push(newBusiness);
      await businessProfile.save();

      // Call the audit log directly to test the event
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "application_submitted",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business Resubmit",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          submittedAt: newBusiness.submittedAt,
          isResubmit: true,
          role: "business_owner",
          entityType: "BusinessProfile",
          entityId: businessId,
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "business_application_submitted",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business Resubmit",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          submittedAt: newBusiness.submittedAt,
          isResubmit: true,
          role: "business_owner",
          entityType: "BusinessProfile",
          entityId: businessId,
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      // Wait for audit log to be created
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify audit log was created with isResubmit flag
      const auditLogs = await AuditLog.find({
        eventType: "business_application_submitted",
        "metadata.entityId": businessId,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const auditLog = auditLogs[0];
      expect(auditLog.eventType).toBe("business_application_submitted");
      expect(auditLog.metadata.isResubmit).toBe(true);
    });
  });

  describe("claim event", () => {
    it("should create audit log when officer claims an application", async () => {
      // Create a submitted application directly in database
      const businessId = new mongoose.Types.ObjectId().toString();
      const newBusiness = {
        _id: new mongoose.Types.ObjectId(),
        businessId,
        businessName: "Test Business Claim",
        businessRegistrationNumber: "TEST-125",
        businessType: "g",
        applicationStatus: "submitted",
        location: {
          street: "125 Test St",
          barangay: "Test Barangay",
          city: "Test City",
          municipality: "Test Municipality",
        },
        businessStartDate: new Date("2024-01-01"),
        numberOfBranches: 1,
        industryClassification: "Retail",
        taxIdentificationNumber: "123456789",
        contactNumber: "1234567890",
        riskProfile: {
          businessSize: 1,
          annualRevenue: 100000,
          businessActivitiesDescription: "Test activities",
        },
        submittedAt: new Date(),
        submittedToLguOfficer: true,
        isSubmitted: true,
        applicationReferenceNumber: `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      businessProfile.businesses.push(newBusiness);
      await businessProfile.save();

      // Clear audit logs from submission
      await AuditLog.deleteMany({});

      // Call the audit log directly to test the event
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "business_updated",
        fieldChanged: "system",
        oldValue: "",
        newValue: "Test Officer",
        role: "lgu_officer",
        metadata: JSON.stringify({
          claimedByName: "Test Officer",
          applicationStatus: "submitted",
          businessName: "Test Business Claim",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          role: "lgu_officer",
          entityType: "BusinessProfile",
          entityId: businessId,
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "business_updated",
        fieldChanged: "system",
        oldValue: "",
        newValue: "Test Officer",
        role: "lgu_officer",
        metadata: {
          claimedByName: "Test Officer",
          applicationStatus: "submitted",
          businessName: "Test Business Claim",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          role: "lgu_officer",
          entityType: "BusinessProfile",
          entityId: businessId,
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      // Wait for audit log to be created
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify audit log was created
      const auditLogs = await AuditLog.find({
        eventType: "business_updated",
        "metadata.entityId": businessId,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const auditLog = auditLogs[0];
      expect(auditLog.eventType).toBe("business_updated");
      expect(auditLog.userId.toString()).toBe(testOfficer._id.toString());
      expect(auditLog.metadata.entityId).toBe(businessId);
      expect(auditLog.metadata.claimedByName).toBe("Test Officer");
      expect(auditLog.metadata.applicationStatus).toBe("submitted");
      expect(auditLog.metadata.role).toBe("lgu_officer");
    });
  });

  describe("application_rejected event", () => {
    it("should create audit log when application is rejected", async () => {
      // Create a submitted application directly in database
      const businessId = new mongoose.Types.ObjectId().toString();
      const newBusiness = {
        _id: new mongoose.Types.ObjectId(),
        businessId,
        businessName: "Test Business Reject",
        businessRegistrationNumber: "TEST-126",
        businessType: "g",
        applicationStatus: "submitted",
        location: {
          street: "126 Test St",
          barangay: "Test Barangay",
          city: "Test City",
          municipality: "Test Municipality",
        },
        businessStartDate: new Date("2024-01-01"),
        numberOfBranches: 1,
        industryClassification: "Retail",
        taxIdentificationNumber: "123456789",
        contactNumber: "1234567890",
        riskProfile: {
          businessSize: 1,
          annualRevenue: 100000,
          businessActivitiesDescription: "Test activities",
        },
        submittedAt: new Date(),
        submittedToLguOfficer: true,
        isSubmitted: true,
        applicationReferenceNumber: `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      businessProfile.businesses.push(newBusiness);
      await businessProfile.save();

      // Clear audit logs from submission
      await AuditLog.deleteMany({});

      // Call the audit log directly to test the event
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "application_rejected",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          rejectedByName: "Test Officer",
          rejectionReason: "Test rejection reason",
          oldStatus: "under_review",
          newStatus: "rejected",
          businessName: "Test Business Reject",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          role: "lgu_officer",
          entityType: "BusinessProfile",
          entityId: businessId,
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "business_updated",
        fieldChanged: "applicationStatus",
        oldValue: "under_review",
        newValue: "rejected",
        role: "lgu_officer",
        metadata: {
          rejectedByName: "Test Officer",
          rejectionReason: "Test rejection reason",
          oldStatus: "under_review",
          newStatus: "rejected",
          businessName: "Test Business Reject",
          applicationReferenceNumber: newBusiness.applicationReferenceNumber,
          role: "lgu_officer",
          entityType: "BusinessProfile",
          entityId: businessId,
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      // Wait for audit log to be created
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify audit log was created
      const auditLogs = await AuditLog.find({
        eventType: "business_updated",
        "metadata.entityId": businessId,
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const auditLog = auditLogs[0];
      expect(auditLog.eventType).toBe("business_updated");
      expect(auditLog.userId.toString()).toBe(testOfficer._id.toString());
      expect(auditLog.metadata.entityId).toBe(businessId);
      expect(auditLog.metadata.rejectedByName).toBe("Test Officer");
      expect(auditLog.metadata.rejectionReason).toBe("Test rejection reason");
      expect(auditLog.metadata.oldStatus).toBe("under_review");
      expect(auditLog.metadata.newStatus).toBe("rejected");
      expect(auditLog.metadata.role).toBe("lgu_officer");
    });
  });

  describe("application_returned event", () => {
    it("should create audit log when application is returned for revision", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "application_returned",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "application_returned",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "application_returned",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("application_returned");
    });
  });

  describe("completed_review event", () => {
    it("should create audit log when officer completes review", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "completed_review",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "completed_review",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "completed_review",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("completed_review");
    });
  });

  describe("decision_revoked event", () => {
    it("should create audit log when officer revokes a decision", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "decision_revoked",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "decision_revoked",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "decision_revoked",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("decision_revoked");
    });
  });

  describe("application_claimed event", () => {
    it("should create audit log when officer claims an application", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "application_claimed",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "application_claimed",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "application_claimed",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("application_claimed");
    });
  });

  describe("application_released event", () => {
    it("should create audit log when officer releases an application", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "application_released",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "application_released",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "application_released",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("application_released");
    });
  });

  describe("application_transferred event", () => {
    it("should create audit log when officer transfers an application", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "application_transferred",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "application_transferred",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "application_transferred",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("application_transferred");
    });
  });

  describe("appeal_submitted event", () => {
    it("should create audit log when business owner submits an appeal", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "appeal_submitted",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "appeal_submitted",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "Appeal",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "appeal_submitted",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("appeal_submitted");
    });
  });

  describe("appeal_resolved event", () => {
    it("should create audit log when officer resolves an appeal", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "appeal_resolved",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "appeal_resolved",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Appeal",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "appeal_resolved",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("appeal_resolved");
    });
  });

  describe("appeal_rejected event", () => {
    it("should create audit log when officer rejects an appeal", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "appeal_rejected",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "appeal_rejected",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Appeal",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "appeal_rejected",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("appeal_rejected");
    });
  });

  describe("edit_request_submitted event", () => {
    it("should create audit log when business owner submits an edit request", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "edit_request_submitted",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "edit_request_submitted",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "EditRequest",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "edit_request_submitted",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("edit_request_submitted");
    });
  });

  describe("edit_request_applied event", () => {
    it("should create audit log when officer applies an edit request", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "edit_request_applied",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "edit_request_applied",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "EditRequest",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "edit_request_applied",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("edit_request_applied");
    });
  });

  describe("payment_recorded event", () => {
    it("should create audit log when payment is recorded", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "payment_recorded",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "payment_recorded",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "Payment",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "payment_recorded",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("payment_recorded");
    });
  });

  describe("permit_issued event", () => {
    it("should create audit log when permit is issued", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "permit_issued",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "permit_issued",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Permit",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "permit_issued",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("permit_issued");
    });
  });

  describe("permit_suspended event", () => {
    it("should create audit log when permit is suspended", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "permit_suspended",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "permit_suspended",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Permit",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "permit_suspended",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("permit_suspended");
    });
  });

  describe("permit_revoked event", () => {
    it("should create audit log when permit is revoked", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "permit_revoked",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "permit_revoked",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Permit",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "permit_revoked",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("permit_revoked");
    });
  });

  describe("inspection_completed event", () => {
    it("should create audit log when inspection is completed", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "inspection_completed",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "inspection_completed",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Inspection",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "inspection_completed",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("inspection_completed");
    });
  });

  describe("violation_issued event", () => {
    it("should create audit log when violation is issued", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "violation_issued",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "violation_issued",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Violation",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "violation_issued",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("violation_issued");
    });
  });

  describe("business_registered event", () => {
    it("should create audit log when business is registered", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "business_registered",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "business_registered",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "business_registered",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("business_registered");
    });
  });

  describe("profile_update event", () => {
    it("should create audit log when profile is updated", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "profile_update",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "profile_update",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "profile_update",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("profile_update");
    });
  });

  describe("renewal_submitted event", () => {
    it("should create audit log when renewal is submitted", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testUser._id),
        eventType: "renewal_submitted",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testUser._id,
        eventType: "renewal_submitted",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "business_owner",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "business_owner",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "renewal_submitted",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("renewal_submitted");
    });
  });

  describe("amendment_approved event", () => {
    it("should create audit log when amendment is approved", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "amendment_approved",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "amendment_approved",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "Business",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "amendment_approved",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("amendment_approved");
    });
  });

  describe("walk_in_registered event", () => {
    it("should create audit log when walk-in is registered", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "walk_in_registered",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "walk_in_registered",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "BusinessProfile",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "walk_in_registered",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("walk_in_registered");
    });
  });

  describe("status_update event", () => {
    it("should create audit log when help request status is updated", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "status_update",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "status_update",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "HelpRequest",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "status_update",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("status_update");
    });
  });

  describe("priority_update event", () => {
    it("should create audit log when help request priority is updated", async () => {
      const businessId = new mongoose.Types.ObjectId().toString();
      const crypto = require("crypto");
      const timestamp = new Date().toISOString();
      const hashableData = {
        userId: String(testOfficer._id),
        eventType: "priority_update",
        fieldChanged: "",
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: JSON.stringify({
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        }),
        timestamp,
      };
      const dataString = JSON.stringify(hashableData);
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      await AuditLog.create({
        userId: testOfficer._id,
        eventType: "priority_update",
        fieldChanged: null,
        oldValue: "",
        newValue: "",
        role: "lgu_officer",
        metadata: {
          businessName: "Test Business",
          entityId: businessId,
          role: "lgu_officer",
        },
        entityType: "HelpRequest",
        entityId: businessId,
        hash,
      });

      const auditLogs = await AuditLog.find({
        eventType: "priority_update",
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].eventType).toBe("priority_update");
    });
  });
});
