import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    throw new Error("No signers found. Check your network config and .env file.");
  }

  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();

  await simpleStorage.waitForDeployment(); 

  console.log("SimpleStorage deployed to:", simpleStorage.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
