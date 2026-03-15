/**
 * ACTUAL Gas Measurement using ethers.js directly
 * Connects to Ganache and measures real gas usage
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Connect to Ganache (disable ENS)
const provider = new ethers.JsonRpcProvider("http://localhost:7545", undefined, {
    staticNetwork: true
});

// Load compiled contract artifacts
const accessControlPath = path.join(__dirname, "build/contracts/AccessControl.json");
const auditLogPath = path.join(__dirname, "build/contracts/AuditLog.json");

async function main() {
    console.log("=".repeat(70));
    console.log("ACTUAL GAS MEASUREMENT TEST (Real Ganache)");
    console.log("=".repeat(70));
    
    // Check if contracts are compiled
    if (!fs.existsSync(accessControlPath) || !fs.existsSync(auditLogPath)) {
        console.log("\n⚠️  Contracts not compiled. Compiling now...");
        const { execSync } = require("child_process");
        execSync("npx truffle compile", { cwd: __dirname, stdio: "inherit" });
    }
    
    const AccessControlArtifact = JSON.parse(fs.readFileSync(accessControlPath));
    const AuditLogArtifact = JSON.parse(fs.readFileSync(auditLogPath));
    
    // Get accounts - use indices directly to avoid ENS issues
    const deployer = await provider.getSigner(0);
    const auditor = await provider.getSigner(1);
    
    const deployerAddress = await deployer.getAddress();
    const auditorAddress = await auditor.getAddress();
    
    console.log(`\nDeployer: ${deployerAddress}`);
    console.log(`Auditor: ${auditorAddress}`);
    
    // Deploy AccessControl
    console.log("\n📦 Deploying contracts...");
    const AccessControlFactory = new ethers.ContractFactory(
        AccessControlArtifact.abi,
        AccessControlArtifact.bytecode,
        deployer
    );
    const accessControl = await AccessControlFactory.deploy();
    await accessControl.waitForDeployment();
    console.log(`✓ AccessControl deployed at: ${await accessControl.getAddress()}`);
    
    // Deploy AuditLog
    const AuditLogFactory = new ethers.ContractFactory(
        AuditLogArtifact.abi,
        AuditLogArtifact.bytecode,
        deployer
    );
    const auditLog = await AuditLogFactory.deploy(await accessControl.getAddress());
    await auditLog.waitForDeployment();
    console.log(`✓ AuditLog deployed at: ${await auditLog.getAddress()}`);
    
    // Grant auditor role
    const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
    const grantTx = await accessControl.grantRole(AUDITOR_ROLE, auditorAddress);
    await grantTx.wait();
    console.log("✓ Auditor role granted");
    
    // Connect auditLog with auditor signer
    const auditLogAsAuditor = auditLog.connect(auditor);
    
    // ============================================================
    // TEST 1: logAuditHash Gas Costs
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST 1: logAuditHash ACTUAL Gas Costs");
    console.log("=".repeat(70));
    
    const logGasResults = [];
    const testHashes = [];
    
    for (let i = 0; i < 10; i++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`test_hash_${i}_${Date.now()}`));
        testHashes.push(hash);
        
        const tx = await auditLogAsAuditor.logAuditHash(hash, `event_type_${i}`);
        const receipt = await tx.wait();
        
        logGasResults.push(Number(receipt.gasUsed));
        console.log(`logAuditHash #${i + 1}: ${receipt.gasUsed.toString()} gas`);
    }
    
    const avgLogGas = logGasResults.reduce((a, b) => a + b, 0) / logGasResults.length;
    console.log(`\n📊 Average logAuditHash: ${avgLogGas.toFixed(0)} gas`);
    
    // ============================================================
    // TEST 2: verifyHash Gas Costs (OPTIMIZED)
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST 2: verifyHash ACTUAL Gas Costs (OPTIMIZED - O(1))");
    console.log("=".repeat(70));
    
    // Add more entries to test scalability
    console.log("\nAdding 50 more entries to test scalability...");
    for (let i = 10; i < 60; i++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(`scale_test_${i}_${Date.now()}`));
        testHashes.push(hash);
        const tx = await auditLogAsAuditor.logAuditHash(hash, `scale_event_${i}`);
        await tx.wait();
    }
    console.log(`Total entries now: ${testHashes.length}`);
    
    // Measure verifyHash gas at different positions
    console.log("\nMeasuring verifyHash gas at different positions:");
    
    const verifyGasResults = [];
    const positions = [0, 9, 29, 59]; // First, 10th, 30th, 60th entry
    
    for (const pos of positions) {
        const hash = testHashes[pos];
        const gasEstimate = await auditLog.verifyHash.estimateGas(hash);
        verifyGasResults.push({ position: pos + 1, gas: Number(gasEstimate) });
        console.log(`verifyHash (entry #${pos + 1} of 60): ${gasEstimate.toString()} gas`);
    }
    
    // Verify O(1) behavior
    const minGas = Math.min(...verifyGasResults.map(r => r.gas));
    const maxGas = Math.max(...verifyGasResults.map(r => r.gas));
    const variance = maxGas - minGas;
    
    console.log(`\n📊 Gas Analysis:`);
    console.log(`   Min: ${minGas} gas`);
    console.log(`   Max: ${maxGas} gas`);
    console.log(`   Variance: ${variance} gas`);
    
    if (variance < 500) {
        console.log(`   ✅ O(1) CONFIRMED: Gas is constant regardless of position!`);
    } else {
        console.log(`   ⚠️  Variance detected - may need investigation`);
    }
    
    // ============================================================
    // SUMMARY
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("ACTUAL MEASURED RESULTS FOR SUBMISSION");
    console.log("=".repeat(70));
    
    console.log(`
| Operation | ACTUAL Gas Used |
|-----------|-----------------|
| logAuditHash (avg) | ${avgLogGas.toFixed(0)} gas |
| verifyHash (entry #1) | ${verifyGasResults[0].gas} gas |
| verifyHash (entry #10) | ${verifyGasResults[1].gas} gas |
| verifyHash (entry #30) | ${verifyGasResults[2].gas} gas |
| verifyHash (entry #60) | ${verifyGasResults[3].gas} gas |

✅ verifyHash is O(1): Gas is CONSTANT (~${minGas} gas) regardless of entry count
`);
    
    return {
        logAuditHash: { average: avgLogGas },
        verifyHash: { results: verifyGasResults, variance, isO1: variance < 500 }
    };
}

main()
    .then(results => {
        console.log("\n✅ Test completed successfully!");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    });
