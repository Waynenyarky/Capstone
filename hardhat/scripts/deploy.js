import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();

  await simpleStorage.waitForDeployment(); // ethers v6

  console.log("SimpleStorage deployed to:", simpleStorage.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
