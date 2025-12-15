import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = SimpleStorage.attach(contractAddress);

  const inputHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const tx = await simpleStorage.storeHash(inputHash);
  console.log("Transaction sent, hash:", tx.hash);
  await tx.wait();

  
  const latestHash = await simpleStorage.latestHash();
  console.log("Latest hash in contract:", latestHash);

  console.log(
    latestHash === inputHash ? "Hash matches input" : "Hash mismatch"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
