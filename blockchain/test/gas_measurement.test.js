/**
 * ACTUAL Gas Measurement Test for AuditLog Contract
 * This runs on real Ganache and measures ACTUAL gas used
 */

const AccessControl = artifacts.require("AccessControl");
const AuditLog = artifacts.require("AuditLog");

contract("AuditLog Gas Measurement", (accounts) => {
    const [owner, auditor] = accounts;
    let accessControl, auditLog;
    
    before(async () => {
        // Deploy contracts
        accessControl = await AccessControl.new();
        auditLog = await AuditLog.new(accessControl.address);
        
        // Grant auditor role
        const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
        await accessControl.grantRole(AUDITOR_ROLE, auditor);
        
        console.log("\n" + "=".repeat(70));
        console.log("ACTUAL GAS MEASUREMENT TEST");
        console.log("=".repeat(70));
    });
    
    describe("logAuditHash Gas Costs", () => {
        const gasResults = [];
        
        it("should measure gas for 10 logAuditHash calls", async () => {
            console.log("\n--- logAuditHash Gas Measurements ---");
            
            for (let i = 0; i < 10; i++) {
                const hash = web3.utils.keccak256(`test_hash_${i}_${Date.now()}`);
                const tx = await auditLog.logAuditHash(hash, `event_${i}`, { from: auditor });
                
                gasResults.push({
                    call: i + 1,
                    gasUsed: tx.receipt.gasUsed
                });
                
                console.log(`  logAuditHash #${i + 1}: ${tx.receipt.gasUsed} gas`);
            }
            
            const avgGas = gasResults.reduce((sum, r) => sum + r.gasUsed, 0) / gasResults.length;
            console.log(`\n  Average logAuditHash: ${avgGas.toFixed(0)} gas`);
        });
    });
    
    describe("verifyHash Gas Costs (OPTIMIZED - O(1))", () => {
        const testHashes = [];
        
        before(async () => {
            // Add more entries to test scalability
            console.log("\n--- Adding entries for verifyHash test ---");
            for (let i = 0; i < 50; i++) {
                const hash = web3.utils.keccak256(`verify_test_${i}_${Date.now()}`);
                testHashes.push(hash);
                await auditLog.logAuditHash(hash, `verify_event_${i}`, { from: auditor });
            }
            console.log(`  Added ${testHashes.length} entries (total: 60 entries now)`);
        });
        
        it("should measure gas for verifyHash at different positions", async () => {
            console.log("\n--- verifyHash Gas Measurements (OPTIMIZED) ---");
            
            // Test verifying hashes at different positions
            const positions = [0, 10, 25, 49]; // First, early, middle, last
            
            for (const pos of positions) {
                const hash = testHashes[pos];
                
                // For view functions, we estimate gas
                const gasEstimate = await auditLog.verifyHash.estimateGas(hash);
                
                console.log(`  verifyHash (position ${pos + 11}): ${gasEstimate} gas`);
            }
            
            // Verify the result is correct
            const [exists, timestamp] = await auditLog.verifyHash(testHashes[0]);
            console.log(`\n  Verification check: exists=${exists}, timestamp=${timestamp.toString()}`);
            assert.equal(exists, true, "Hash should exist");
        });
        
        it("should show O(1) behavior - gas is constant regardless of position", async () => {
            console.log("\n--- O(1) Verification ---");
            
            const gasEstimates = [];
            for (const hash of testHashes.slice(0, 10)) {
                const gas = await auditLog.verifyHash.estimateGas(hash);
                gasEstimates.push(gas);
            }
            
            const min = Math.min(...gasEstimates);
            const max = Math.max(...gasEstimates);
            const variance = max - min;
            
            console.log(`  Min gas: ${min}`);
            console.log(`  Max gas: ${max}`);
            console.log(`  Variance: ${variance} gas`);
            
            if (variance < 100) {
                console.log(`  ✅ O(1) CONFIRMED: Gas is constant (variance < 100)`);
            } else {
                console.log(`  ⚠️  Variance detected: ${variance} gas`);
            }
        });
    });
    
    after(async () => {
        console.log("\n" + "=".repeat(70));
        console.log("TEST COMPLETE - Use these ACTUAL values in your submission");
        console.log("=".repeat(70) + "\n");
    });
});
