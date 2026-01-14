const hre = require("hardhat");

async function main() {
  console.log("Deploying AuditLog contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const AuditLog = await hre.ethers.getContractFactory("AuditLog");
  const auditLog = await AuditLog.deploy();

  await auditLog.waitForDeployment();
  const address = await auditLog.getAddress();

  console.log("AuditLog contract deployed to:", address);
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", address);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\n=== Next Steps ===");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your .env file as AUDIT_CONTRACT_ADDRESS");
  console.log("3. Verify the contract in Ganache UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
