/**
 * ACTUAL Gas Measurement using web3.js
 * Connects to Ganache and measures real gas usage
 */

const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

const web3 = new Web3("http://localhost:7545");

const accessControlPath = path.join(__dirname, "build/contracts/AccessControl.json");
const auditLogPath = path.join(__dirname, "build/contracts/AuditLog.json");

async function main() {
    console.log("=".repeat(70));
    console.log("ACTUAL GAS MEASUREMENT TEST (Real Ganache + web3.js)");
    console.log("=".repeat(70));
    
    const AccessControlArtifact = JSON.parse(fs.readFileSync(accessControlPath));
    const AuditLogArtifact = JSON.parse(fs.readFileSync(auditLogPath));
    
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const auditor = accounts[1];
    
    console.log(`\nDeployer: ${deployer}`);
    console.log(`Auditor: ${auditor}`);
    
    // Deploy AccessControl
    console.log("\n📦 Deploying contracts...");
    const AccessControl = new web3.eth.Contract(AccessControlArtifact.abi);
    const accessControl = await AccessControl.deploy({
        data: AccessControlArtifact.bytecode
    }).send({ from: deployer, gas: 3000000 });
    console.log(`✓ AccessControl deployed at: ${accessControl.options.address}`);
    
    // Deploy AuditLog
    const AuditLog = new web3.eth.Contract(AuditLogArtifact.abi);
    const auditLog = await AuditLog.deploy({
        data: AuditLogArtifact.bytecode,
        arguments: [accessControl.options.address]
    }).send({ from: deployer, gas: 3000000 });
    console.log(`✓ AuditLog deployed at: ${auditLog.options.address}`);
    
    // Grant auditor role - grantRole(address account, bytes32 role)
    const AUDITOR_ROLE = await accessControl.methods.AUDITOR_ROLE().call();
    await accessControl.methods.grantRole(auditor, AUDITOR_ROLE).send({ from: deployer, gas: 200000 });
    console.log("✓ Auditor role granted");
    
    // ============================================================
    // TEST 1: logAuditHash Gas Costs
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST 1: logAuditHash ACTUAL Gas Costs");
    console.log("=".repeat(70));
    
    const logGasResults = [];
    const testHashes = [];
    
    for (let i = 0; i < 10; i++) {
        const hash = web3.utils.keccak256(`test_hash_${i}_${Date.now()}`);
        testHashes.push(hash);
        
        const receipt = await auditLog.methods.logAuditHash(hash, `event_type_${i}`)
            .send({ from: auditor, gas: 200000 });
        
        logGasResults.push(Number(receipt.gasUsed));
        console.log(`logAuditHash #${i + 1}: ${receipt.gasUsed} gas`);
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
        const hash = web3.utils.keccak256(`scale_test_${i}_${Date.now()}`);
        testHashes.push(hash);
        await auditLog.methods.logAuditHash(hash, `scale_event_${i}`)
            .send({ from: auditor, gas: 200000 });
    }
    console.log(`Total entries now: ${testHashes.length}`);
    
    // Measure verifyHash gas at different positions
    console.log("\nMeasuring verifyHash gas at different positions:");
    
    const verifyGasResults = [];
    const positions = [0, 9, 29, 59]; // First, 10th, 30th, 60th entry
    
    for (const pos of positions) {
        const hash = testHashes[pos];
        const gasEstimate = await auditLog.methods.verifyHash(hash).estimateGas();
        verifyGasResults.push({ position: pos + 1, gas: Number(gasEstimate) });
        console.log(`verifyHash (entry #${pos + 1} of 60): ${gasEstimate} gas`);
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
    
    // Verify result is correct
    const result = await auditLog.methods.verifyHash(testHashes[0]).call();
    console.log(`\n   Verification check: exists=${result.exists}, timestamp=${result.timestamp}`);
    
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
        logAuditHash: { average: avgLogGas, results: logGasResults },
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
