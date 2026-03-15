/**
 * Performance monitoring for blockchain components
 * Measure gas costs for critical contract functions
 */

const { ethers } = require("hardhat");

async function measureGasCost(contract, functionName, ...args) {
    console.log(`\n--- Testing ${functionName} ---`);
    
    const tx = await contract[functionName](...args);
    const receipt = await tx.wait();
    
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Transaction Hash: ${receipt.transactionHash}`);
    
    return {
        function: functionName,
        gasUsed: receipt.gasUsed.toString(),
        txHash: receipt.transactionHash,
        args: args
    };
}

async function runBlockchainPerformanceTests() {
    console.log("=== Blockchain Performance Monitoring ===");
    
    // Deploy contracts for testing
    const [owner, auditor, user] = await ethers.getSigners();
    
    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.deployed();
    
    // Deploy AuditLog
    const AuditLog = await ethers.getContractFactory("AuditLog");
    const auditLog = await AuditLog.deploy(accessControl.address);
    await auditLog.deployed();
    
    // Setup roles
    const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();
    await accessControl.grantRole(AUDITOR_ROLE, auditor.address);
    
    const results = [];
    
    // Test 1: logAuditHash with different hash sizes
    const testHashes = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("small_test")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("medium_size_test_data_with_more_content")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("large_test_data_with_significantly_more_content_to_measure_storage_costs"))
    ];
    
    for (let i = 0; i < testHashes.length; i++) {
        const result = await measureGasCost(
            auditLog.connect(auditor),
            "logAuditHash",
            testHashes[i],
            `test_event_${i}`
        );
        results.push(result);
    }
    
    // Test 2: logCriticalEvent with different data sizes
    const testEvents = [
        ["user_login", "user123", '{"ip":"127.0.0.1"}'],
        ["profile_update", "user456", '{"field":"name","old":"John","new":"Jane"}'],
        ["complex_transaction", "user789", '{"type":"payment","amount":1000,"currency":"USD","items":[{"id":1,"qty":2},{"id":2,"qty":1}],"metadata":{"source":"web","device":"mobile"}}']
    ];
    
    for (const eventData of testEvents) {
        const result = await measureGasCost(
            auditLog.connect(auditor),
            "logCriticalEvent",
            ...eventData
        );
        results.push(result);
    }
    
    // Test 3: logAdminApproval
    const result = await measureGasCost(
        auditLog.connect(auditor),
        "logAdminApproval",
        "approval_123",
        "business_permit",
        "user123",
        "admin456",
        true,
        '{"reason":"All documents verified"}'
    );
    results.push(result);
    
    // Test 4: verifyHash (read operation)
    console.log("\n--- Testing verifyHash (read operation) ---");
    const verifyTx = await auditLog.verifyHash(testHashes[0]);
    const verifyReceipt = await verifyTx.wait();
    console.log(`Gas Used (verifyHash): ${verifyReceipt.gasUsed.toString()}`);
    
    results.push({
        function: "verifyHash",
        gasUsed: verifyReceipt.gasUsed.toString(),
        type: "read_operation"
    });
    
    console.log("\n=== Blockchain Performance Results ===");
    results.forEach(result => {
        console.log(`Function: ${result.function}`);
        console.log(`  Gas Used: ${result.gasUsed}`);
        if (result.args) {
            console.log(`  Args: ${JSON.stringify(result.args.slice(0, 2))}...`);
        }
        console.log();
    });
    
    return results;
}

// Export for use in tests
module.exports = {
    measureGasCost,
    runBlockchainPerformanceTests
};

// Run if called directly
if (require.main === module) {
    runBlockchainPerformanceTests()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
