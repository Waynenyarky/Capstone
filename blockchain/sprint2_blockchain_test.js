/**
 * Sprint 2 Blockchain Test - Audit History Feature
 * Tests the new getAuditHistory, getRecentAudits, and getAuditStats functions
 */

const { Web3 } = require("web3");
const fs = require("fs");
const path = require("path");

const web3 = new Web3("http://localhost:7545");

const accessControlPath = path.join(__dirname, "build/contracts/AccessControl.json");
const auditLogPath = path.join(__dirname, "build/contracts/AuditLog.json");

async function main() {
    console.log("=".repeat(70));
    console.log("SPRINT 2 BLOCKCHAIN TEST: Audit History Feature");
    console.log("=".repeat(70));
    
    const AccessControlArtifact = JSON.parse(fs.readFileSync(accessControlPath));
    const AuditLogArtifact = JSON.parse(fs.readFileSync(auditLogPath));
    
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const auditor = accounts[1];
    
    console.log(`\nDeployer: ${deployer}`);
    console.log(`Auditor: ${auditor}`);
    
    // Deploy contracts
    console.log("\n📦 Deploying contracts...");
    const AccessControl = new web3.eth.Contract(AccessControlArtifact.abi);
    const accessControl = await AccessControl.deploy({
        data: AccessControlArtifact.bytecode
    }).send({ from: deployer, gas: 3000000 });
    
    const AuditLog = new web3.eth.Contract(AuditLogArtifact.abi);
    const auditLog = await AuditLog.deploy({
        data: AuditLogArtifact.bytecode,
        arguments: [accessControl.options.address]
    }).send({ from: deployer, gas: 5000000 });
    
    // Grant auditor role
    const AUDITOR_ROLE = await accessControl.methods.AUDITOR_ROLE().call();
    await accessControl.methods.grantRole(auditor, AUDITOR_ROLE).send({ from: deployer, gas: 200000 });
    console.log("✓ Contracts deployed and auditor role granted");
    
    // Add some audit entries
    console.log("\n📝 Adding audit entries...");
    const testHashes = [];
    for (let i = 0; i < 10; i++) {
        const hash = web3.utils.keccak256(`audit_entry_${i}_${Date.now()}`);
        testHashes.push(hash);
        await auditLog.methods.logAuditHash(hash, `event_type_${i}`)
            .send({ from: auditor, gas: 200000 });
        console.log(`  Added entry ${i + 1}/10`);
    }
    
    const results = {
        testCases: [],
        allPassed: true
    };
    
    // ============================================================
    // TEST CASE 1: getAuditStats
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST CASE 1: getAuditStats()");
    console.log("=".repeat(70));
    
    const stats = await auditLog.methods.getAuditStats().call();
    console.log(`  Total Hashes: ${stats.totalHashes}`);
    console.log(`  Total Critical Events: ${stats.totalCriticalEvents}`);
    console.log(`  Total Approvals: ${stats.totalApprovals}`);
    console.log(`  Latest Timestamp: ${stats.latestTimestamp}`);
    
    const test1Pass = Number(stats.totalHashes) === 10;
    console.log(`\n  ${test1Pass ? '✅' : '❌'} Test 1: ${test1Pass ? 'PASSED' : 'FAILED'}`);
    results.testCases.push({
        name: "getAuditStats",
        beforeState: "No stats function available",
        afterState: `Returns: totalHashes=${stats.totalHashes}, totalCriticalEvents=${stats.totalCriticalEvents}`,
        passed: test1Pass,
        improvement: "NEW FEATURE"
    });
    if (!test1Pass) results.allPassed = false;
    
    // ============================================================
    // TEST CASE 2: getRecentAudits
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST CASE 2: getRecentAudits(5)");
    console.log("=".repeat(70));
    
    const recent = await auditLog.methods.getRecentAudits(5).call();
    console.log(`  Retrieved ${recent.hashes.length} recent entries`);
    for (let i = 0; i < recent.hashes.length; i++) {
        console.log(`    Entry ${i + 1}: ${recent.eventTypes[i]} at ${recent.timestamps[i]}`);
    }
    
    const test2Pass = recent.hashes.length === 5;
    console.log(`\n  ${test2Pass ? '✅' : '❌'} Test 2: ${test2Pass ? 'PASSED' : 'FAILED'}`);
    results.testCases.push({
        name: "getRecentAudits",
        beforeState: "Had to iterate through all entries manually",
        afterState: `Returns last N entries directly (got ${recent.hashes.length} entries)`,
        passed: test2Pass,
        improvement: "NEW FEATURE"
    });
    if (!test2Pass) results.allPassed = false;
    
    // ============================================================
    // TEST CASE 3: getAuditHistory with time range
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST CASE 3: getAuditHistory(timeRange)");
    console.log("=".repeat(70));
    
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    
    const history = await auditLog.methods.getAuditHistory(oneHourAgo, now, 0, 10).call();
    console.log(`  Time range: ${oneHourAgo} to ${now}`);
    console.log(`  Total in range: ${history.totalInRange}`);
    console.log(`  Retrieved: ${history.hashes.length} entries`);
    
    const test3Pass = Number(history.totalInRange) === 10 && history.hashes.length === 10;
    console.log(`\n  ${test3Pass ? '✅' : '❌'} Test 3: ${test3Pass ? 'PASSED' : 'FAILED'}`);
    results.testCases.push({
        name: "getAuditHistory",
        beforeState: "No time-based filtering available",
        afterState: `Filters by time range with pagination (found ${history.totalInRange} in range)`,
        passed: test3Pass,
        improvement: "NEW FEATURE"
    });
    if (!test3Pass) results.allPassed = false;
    
    // ============================================================
    // SUMMARY
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("SPRINT 2 BLOCKCHAIN TEST RESULTS");
    console.log("=".repeat(70));
    
    console.log("\n| Test Case | Before State | After State | Result |");
    console.log("|-----------|--------------|-------------|--------|");
    for (const tc of results.testCases) {
        console.log(`| ${tc.name} | ${tc.beforeState.substring(0, 30)}... | ${tc.afterState.substring(0, 30)}... | ${tc.passed ? '✅ PASS' : '❌ FAIL'} |`);
    }
    
    console.log(`\n${results.allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
}

main()
    .then(results => {
        console.log("\n✅ Sprint 2 Blockchain test completed!");
        console.log(JSON.stringify(results, null, 2));
        process.exit(results.allPassed ? 0 : 1);
    })
    .catch(error => {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    });
