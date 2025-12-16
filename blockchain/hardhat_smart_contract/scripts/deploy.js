import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const latestTime = (await ethers.provider.getBlock("latest")).timestamp;
  const unlockTime = latestTime + ONE_YEAR_IN_SECS;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: ethers.parseEther("1") });

  await lock.waitForDeployment();
  console.log("Lock deployed to:", lock.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
