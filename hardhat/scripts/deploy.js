import hardhat from "hardhat";
import dotenv from "dotenv";
dotenv.config();

const { ethers } = hardhat;

async function main() {
  
  const networkUrl = process.env.RPC_URL_SEPOLIA;
  const privateKey = process.env.PRIVATE_KEY_SEPOLIA;

  if (!networkUrl || !privateKey) {
    throw new Error("RPC_URL_SEPOLIA or PRIVATE_KEY_SEPOLIA is missing in your .env file");
  }

  console.log("Using network RPC:", networkUrl);


  const provider = new ethers.JsonRpcProvider(networkUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", deployer.address);

  
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage", deployer);
  const simpleStorage = await SimpleStorage.deploy();

 
  await simpleStorage.waitForDeployment();

  console.log("SimpleStorage deployed to:", simpleStorage.target);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
