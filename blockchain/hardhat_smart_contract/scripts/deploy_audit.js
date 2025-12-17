import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AuditAnchor with account:", deployer.address);

  const AuditAnchor = await hre.ethers.getContractFactory("AuditAnchor");
  const auditAnchor = await AuditAnchor.deploy();
  await auditAnchor.waitForDeployment();
  const address = await auditAnchor.getAddress();
  console.log(`AuditAnchor deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
