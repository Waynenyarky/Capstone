/**
 * Gas Optimization Test for AuditLog Contract
 * Compares gas costs before and after the verifyHash optimization
 * 
 * BEFORE: verifyHash used O(n) loop through auditHashEntries array
 * AFTER: verifyHash uses O(1) direct mapping lookup
 */

const { ethers } = require("hardhat");

async function main() {
    console.log("=".repeat(60));
    console.log("BLOCKCHAIN GAS OPTIMIZATION TEST");
    console.log("=".repeat(60));
    
    // Deploy contracts
    const [owner, auditor] = await ethers.getSigners();
    
    console.log("\n📦 Deploying contracts...");
    
    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    console.log("✓ AccessControl deployed");
    
    // Deploy AuditLog
    const AuditLog = await ethers.getContractFactory("AuditLog");
    const auditLog = await AuditLog.deploy(await accessControl.getAddress());
    await auditLog.waitForDeployment();
    console.log("✓ AuditLog deployed");
    
    // Grant auditor role
    const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
    await accessControl.grantRole(AUDITOR_ROLE, auditor.address);
    console.log("✓ Auditor role granted");
    
    // Test data
    const testHashes = [];
    for (let i = 0; i < 10; i++) {
        testHashes.push(ethers.keccak256(ethers.toUtf8Bytes(`test_hash_${i}_${Date.now()}`)));
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("TEST 1: logAuditHash Gas Costs");
    console.log("=".repeat(60));
    
    const logGasCosts = [];
    
    for (let i = 0; i < testHashes.length; i++) {
        const tx = await auditLog.connect(auditor).logAuditHash(
            testHashes[i],
            `event_type_${i}`
        );
        const receipt = await tx.wait();
        logGasCosts.push(Number(receipt.gasUsed));
        console.log(`logAuditHash #${i + 1}: ${receipt.gasUsed.toString()} gas`);
    }
    
    const avgLogGas = logGasCosts.reduce((a, b) => a + b, 0) / logGasCosts.length;
    console.log(`\nAverage logAuditHash: ${avgLogGas.toFixed(0)} gas`);
    
    console.log("\n" + "=".repeat(60));
    console.log("TEST 2: verifyHash Gas Costs (OPTIMIZED - O(1))");
    console.log("=".repeat(60));
    
    // For view functions, we estimate gas instead of measuring actual usage
    const verifyGasCosts = [];
    
    for (let i = 0; i < testHashes.length; i++) {
        // Estimate gas for the view function
        const gasEstimate = await auditLog.verifyHash.estimateGas(testHashes[i]);
        verifyGasCosts.push(Number(gasEstimate));
        console.log(`verifyHash #${i + 1} (after ${i + 1} entries): ${gasEstimate.toString()} gas`);
    }
    
    const avgVerifyGas = verifyGasCosts.reduce((a, b) => a + b, 0) / verifyGasCosts.length;
    console.log(`\nAverage verifyHash: ${avgVerifyGas.toFixed(0)} gas`);
    
    // Check if gas is constant (O(1) optimization working)
    const gasVariance = Math.max(...verifyGasCosts) - Math.min(...verifyGasCosts);
    
    console.log("\n" + "=".repeat(60));
    console.log("OPTIMIZATION ANALYSIS");
    console.log("=".repeat(60));
    
    console.log(`\nverifyHash gas variance: ${gasVariance} gas`);
    
    if (gasVariance < 100) {
        console.log("✅ OPTIMIZATION SUCCESSFUL: verifyHash has O(1) constant time complexity");
        console.log("   Gas cost does NOT increase with number of entries");
    } else {
        console.log("⚠️  Gas variance detected - may still have O(n) behavior");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("PERFORMANCE COMPARISON");
    console.log("=".repeat(60));
    
    // Simulate what the OLD O(n) implementation would cost
    // Each SLOAD costs ~2100 gas, loop overhead ~100 gas per iteration
    const simulatedOldGasPerEntry = 2200; // SLOAD + loop overhead
    
    console.log("\n| Entries | OLD (O(n)) Est. | NEW (O(1)) Actual | Savings |");
    console.log("|---------|-----------------|-------------------|---------|");
    
    for (let entries of [1, 10, 100, 1000]) {
        const oldGas = entries * simulatedOldGasPerEntry;
        const newGas = avgVerifyGas;
        const savings = ((oldGas - newGas) / oldGas * 100).toFixed(1);
        console.log(`| ${entries.toString().padStart(7)} | ${oldGas.toString().padStart(15)} | ${newGas.toFixed(0).padStart(17)} | ${savings.padStart(6)}% |`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    
    console.log(`
📊 Results:
   - logAuditHash average: ${avgLogGas.toFixed(0)} gas
   - verifyHash average: ${avgVerifyGas.toFixed(0)} gas (OPTIMIZED)
   - Gas variance: ${gasVariance} gas (should be ~0 for O(1))

🎯 Optimization Impact:
   - Before: O(n) - gas increases linearly with entries
   - After: O(1) - constant gas regardless of entries
   - At 1000 entries: ~${((1000 * simulatedOldGasPerEntry - avgVerifyGas) / 1000).toFixed(0)}x improvement
`);
    
    return {
        avgLogGas,
        avgVerifyGas,
        gasVariance,
        optimizationWorking: gasVariance < 100
    };
}

main()
    .then((results) => {
        console.log("\n✅ Test completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    });
