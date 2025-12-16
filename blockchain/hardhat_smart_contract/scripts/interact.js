import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const storage = await SimpleStorage.deploy();
  await storage.waitForDeployment();
  console.log("SimpleStorage deployed:", storage.target);

  const tx = await storage.set(123456);
  await tx.wait();
  const value = await storage.get();
  console.log("Stored value:", value.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
