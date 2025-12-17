const hre = require("hardhat");

async function main() {
  // --- CONFIGURATION ---
  // Replace this with your deployed contract address after running deploy_audit.js
  // For local testing (Ganache), you often need to deploy first and paste the address here,
  // or use a deployment system that tracks deployments. 
  // For this script, we'll assume the user will update it or we deploy a new one for testing.
  
  // Note: In a real scenario, use process.env.CONTRACT_ADDRESS
  const contractAddress = process.env.CONTRACT_ADDRESS; 
  
  if (!contractAddress) {
      console.error("Please set CONTRACT_ADDRESS in your .env file or hardcode it in the script.");
      console.log("Example: set CONTRACT_ADDRESS=0x...");
      return;
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  const AuditAnchor = await hre.ethers.getContractFactory("AuditAnchor");
  const auditAnchor = AuditAnchor.attach(contractAddress);

  // --- MOCK DATA ---
  // This is a sample SHA-256 hash (e.g., of a canonical JSON event)
  const mockHash = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; 
  const source = "test-script";

  console.log(`Anchoring hash: ${mockHash} from source: ${source}...`);

  // --- SEND TRANSACTION ---
  const tx = await auditAnchor.anchor(mockHash, source);
  console.log("Transaction sent. Hash:", tx.hash);

  // --- WAIT FOR CONFIRMATION ---
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);

  // --- CHECK EVENTS ---
  // Retrieve the event from the receipt logs
  // In ethers v6, parsing logs might be slightly different depending on the version installed.
  // We'll rely on the fact that the event was emitted.
  console.log("Anchor successful!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
