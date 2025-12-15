async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();

  console.log("SimpleStorage deployed to:", simpleStorage.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
