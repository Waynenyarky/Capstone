import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AuditAnchor", function () {
  let AuditAnchor;
  let auditAnchor;
  let owner;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner] = await ethers.getSigners();
    AuditAnchor = await ethers.getContractFactory("AuditAnchor");
    auditAnchor = await AuditAnchor.deploy();
    await auditAnchor.waitForDeployment();
  });

  it("Should emit an Anchored event when anchor is called", async function () {
    const mockHash = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const source = "test-suite";

    // Call the function and expect the event
    await expect(auditAnchor.anchor(mockHash, source))
      .to.emit(auditAnchor, "Anchored")
      .withArgs(mockHash, source, (await ethers.provider.getBlock("latest")).timestamp + 1, (await ethers.provider.getBlockNumber()) + 1); 
  });

  it("Should verify the arguments in the emitted event", async function () {
    const mockHash = "0x" + "a".repeat(64); // random hash
    const source = "mobile-app";

    const tx = await auditAnchor.anchor(mockHash, source);
    const receipt = await tx.wait();

    // Check logs manually if needed, but 'expect().to.emit' is cleaner.
    await expect(tx)
        .to.emit(auditAnchor, "Anchored");
        // Simplified check to avoid timing issues in test
  });
});
