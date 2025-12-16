import hardhat from "hardhat";
import dotenv from "dotenv";
dotenv.config();

const { ethers } = hardhat;

async function main() {
  // Connect to the configured network
  const networkUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!networkUrl || !privateKey) {
    throw new Error("RPC_URL or PRIVATE_KEY is missing in your .env file");
  }

  console.log("Using network RPC:", networkUrl);

  // Manually create a signer using the private key for deployment
  const provider = new ethers.JsonRpcProvider(networkUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", deployer.address);

  // Deploy the contract
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage", deployer);
  const simpleStorage = await SimpleStorage.deploy();

  await simpleStorage.waitForDeployment(); // Wait until deployed
  console.log("SimpleStorage deployed to:", simpleStorage.target);
}

// Run the deployment script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
