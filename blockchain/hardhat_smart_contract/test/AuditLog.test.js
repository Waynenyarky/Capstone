const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditLog", function () {
  let auditLog;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const AuditLog = await ethers.getContractFactory("AuditLog");
    auditLog = await AuditLog.deploy();
    await auditLog.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await auditLog.getAddress()).to.be.properAddress;
    });

    it("Should start with zero audit hash entries", async function () {
      expect(await auditLog.getAuditHashCount()).to.equal(0);
    });

    it("Should start with zero critical event entries", async function () {
      expect(await auditLog.getCriticalEventCount()).to.equal(0);
    });
  });

  describe("logAuditHash", function () {
    it("Should log an audit hash successfully", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-hash"));
      const eventType = "profile_update";

      await expect(auditLog.logAuditHash(hash, eventType))
        .to.emit(auditLog, "AuditHashLogged")
        .withArgs(hash, eventType, (value) => value > 0, owner.address);

      expect(await auditLog.getAuditHashCount()).to.equal(1);
      expect(await auditLog.hashExists(hash)).to.be.true;
    });

    it("Should reject zero hash", async function () {
      const zeroHash = ethers.ZeroHash;
      await expect(
        auditLog.logAuditHash(zeroHash, "test")
      ).to.be.revertedWith("Hash cannot be zero");
    });

    it("Should reject empty event type", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        auditLog.logAuditHash(hash, "")
      ).to.be.revertedWith("Event type cannot be empty");
    });

    it("Should reject duplicate hash", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await auditLog.logAuditHash(hash, "test");
      
      await expect(
        auditLog.logAuditHash(hash, "test2")
      ).to.be.revertedWith("Hash already exists");
    });
  });

  describe("logCriticalEvent", function () {
    it("Should log a critical event successfully", async function () {
      const eventType = "admin_approval";
      const userId = "user123";
      const details = '{"action": "email_change", "approved": true}';

      await expect(auditLog.logCriticalEvent(eventType, userId, details))
        .to.emit(auditLog, "CriticalEventLogged")
        .withArgs(eventType, userId, details, (value) => value > 0, owner.address);

      expect(await auditLog.getCriticalEventCount()).to.equal(1);
    });

    it("Should reject empty event type", async function () {
      await expect(
        auditLog.logCriticalEvent("", "user123", "details")
      ).to.be.revertedWith("Event type cannot be empty");
    });

    it("Should reject empty user ID", async function () {
      await expect(
        auditLog.logCriticalEvent("test", "", "details")
      ).to.be.revertedWith("User ID cannot be empty");
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

      await expect(
        auditLog.logAdminApproval(approvalId, eventType, userId, approverId, approved, details)
      )
        .to.emit(auditLog, "AdminApprovalLogged")
        .withArgs(
          approvalId,
          eventType,
          userId,
          approverId,
          approved,
          details,
          (value) => value > 0,
          owner.address
        );

      expect(await auditLog.getAdminApprovalCount()).to.equal(1);
    });
  });

  describe("verifyHash", function () {
    it("Should verify an existing hash", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-hash"));
      await auditLog.logAuditHash(hash, "test");

      const [exists, timestamp] = await auditLog.verifyHash(hash);
      expect(exists).to.be.true;
      expect(timestamp).to.be.gt(0);
    });

    it("Should return false for non-existent hash", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      const [exists, timestamp] = await auditLog.verifyHash(hash);
      expect(exists).to.be.false;
      expect(timestamp).to.equal(0);
    });
  });
});
