const AuditLog = artifacts.require("AuditLog");
const AccessControl = artifacts.require("AccessControl");
const { expect } = require("chai");

contract("AuditLog", function (accounts) {
  let auditLog;
  let accessControl;
  const owner = accounts[0];
  const addr1 = accounts[1];

  beforeEach(async function () {
    // Deploy AccessControl first (owner gets AUDITOR_ROLE automatically)
    accessControl = await AccessControl.new({ from: owner });
    // Deploy AuditLog with AccessControl address
    auditLog = await AuditLog.new(accessControl.address, { from: owner });
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await auditLog.address;
      expect(address).to.not.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should start with zero audit hash entries", async function () {
      const count = await auditLog.getAuditHashCount();
      expect(count.toNumber()).to.equal(0);
    });

    it("Should start with zero critical event entries", async function () {
      const count = await auditLog.getCriticalEventCount();
      expect(count.toNumber()).to.equal(0);
    });
  });

  describe("logAuditHash", function () {
    it("Should log an audit hash successfully", async function () {
      // Create a hash using web3.utils.keccak256
      const hash = web3.utils.keccak256("test-hash");
      const eventType = "profile_update";

      const tx = await auditLog.logAuditHash(hash, eventType, { from: owner });
      
      // Check event was emitted
      expect(tx.logs.length).to.equal(1);
      expect(tx.logs[0].event).to.equal("AuditHashLogged");
      expect(tx.logs[0].args.hash).to.equal(hash);
      expect(tx.logs[0].args.eventType).to.equal(eventType);

      // Check count increased
      const count = await auditLog.getAuditHashCount();
      expect(count.toNumber()).to.equal(1);
      
      // Check hash exists
      const exists = await auditLog.hashExists(hash);
      expect(exists).to.be.true;
    });

    it("Should reject zero hash", async function () {
      const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
      try {
        await auditLog.logAuditHash(zeroHash, "test", { from: owner });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Hash cannot be zero");
      }
    });

    it("Should reject empty event type", async function () {
      const hash = web3.utils.keccak256("test");
      try {
        await auditLog.logAuditHash(hash, "", { from: owner });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Event type cannot be empty");
      }
    });

    it("Should reject duplicate hash", async function () {
      const hash = web3.utils.keccak256("test");
      await auditLog.logAuditHash(hash, "test", { from: owner });
      
      try {
        await auditLog.logAuditHash(hash, "test2", { from: owner });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Hash already exists");
      }
    });
  });

  describe("logCriticalEvent", function () {
    it("Should log a critical event successfully", async function () {
      const eventType = "admin_approval";
      const userId = "user123";
      const details = '{"action": "email_change", "approved": true}';

      const tx = await auditLog.logCriticalEvent(eventType, userId, details, { from: owner });
      
      // Check event was emitted
      expect(tx.logs.length).to.equal(1);
      expect(tx.logs[0].event).to.equal("CriticalEventLogged");
      expect(tx.logs[0].args.eventType).to.equal(eventType);
      expect(tx.logs[0].args.userId).to.equal(userId);
      expect(tx.logs[0].args.details).to.equal(details);

      // Check count increased
      const count = await auditLog.getCriticalEventCount();
      expect(count.toNumber()).to.equal(1);
    });

    it("Should reject empty event type", async function () {
      try {
        await auditLog.logCriticalEvent("", "user123", "details", { from: owner });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Event type cannot be empty");
      }
    });

    it("Should reject empty user ID", async function () {
      try {
        await auditLog.logCriticalEvent("test", "", "details", { from: owner });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("User ID cannot be empty");
      }
    });
  });

  describe("logAdminApproval", function () {
    it("Should log an admin approval successfully", async function () {
      const approvalId = "approval123";
      const eventType = "email_change";
      const userId = "user123";
      const approverId = "admin456";
      const approved = true;
      const details = '{"reason": "Verified identity"}';

      const tx = await auditLog.logAdminApproval(
        approvalId,
        eventType,
        userId,
        approverId,
        approved,
        details,
        { from: owner }
      );
      
      // Check event was emitted
      expect(tx.logs.length).to.equal(1);
      expect(tx.logs[0].event).to.equal("AdminApprovalLogged");
      expect(tx.logs[0].args.approvalId).to.equal(approvalId);
      expect(tx.logs[0].args.eventType).to.equal(eventType);
      expect(tx.logs[0].args.userId).to.equal(userId);
      expect(tx.logs[0].args.approverId).to.equal(approverId);
      expect(tx.logs[0].args.approved).to.be.true;
      expect(tx.logs[0].args.details).to.equal(details);

      // Check count increased
      const count = await auditLog.getAdminApprovalCount();
      expect(count.toNumber()).to.equal(1);
    });
  });

  describe("verifyHash", function () {
    it("Should verify an existing hash", async function () {
      const hash = web3.utils.keccak256("test-hash");
      await auditLog.logAuditHash(hash, "test", { from: owner });

      const result = await auditLog.verifyHash(hash);
      expect(result.exists).to.be.true;
      expect(result.timestamp.toNumber()).to.be.gt(0);
    });

    it("Should return false for non-existent hash", async function () {
      const hash = web3.utils.keccak256("non-existent");
      const result = await auditLog.verifyHash(hash);
      expect(result.exists).to.be.false;
      expect(result.timestamp.toNumber()).to.equal(0);
    });
  });
});
