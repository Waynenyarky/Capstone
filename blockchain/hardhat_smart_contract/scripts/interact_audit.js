import hre from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    return;
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  const AuditAnchor = await hre.ethers.getContractFactory("AuditAnchor");
  const auditAnchor = AuditAnchor.attach(contractAddress);
  const mockHash = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const source = "test-script";

  console.log(`Anchoring hash: ${mockHash} from source: ${source}...`);
  const tx = await auditAnchor.anchor(mockHash, source);
  console.log("Transaction sent. Hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
