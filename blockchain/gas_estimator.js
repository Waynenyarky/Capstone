/**
 * Simple Gas Cost Estimator for Blockchain Performance
 * Estimates gas costs based on operation complexity
 */

// Gas cost constants (approximate values for Ethereum)
const GAS_COSTS = {
    // Basic operations
    ADD: 3,
    MUL: 5,
    DIV: 5,
    SUB: 3,
    
    // Storage operations
    SLOAD: 800,  // Read from storage
    SSTORE: 20000, // Write to storage (zero to non-zero)
    SSTORE_ZERO: 5000, // Write to storage (non-zero to zero)
    
    // String operations
    STRING_LENGTH: 3,
    STRING_COPY: 3,
    
    // Event emission
    EVENT_LOG_BASE: 375,
    EVENT_LOG_TOPIC: 375,
    EVENT_LOG_DATA: 8,
    
    // Hash operations
    KECCAK256: 30,
    SHA256: 60,
    
    // Contract operations
    CALL: 700,
    DELEGATECALL: 700,
    STATICCALL: 700,
    CREATE: 32000,
    CREATE2: 32000
};

// Estimate gas cost for audit log operations
function estimateAuditLogGas(operation, params) {
    let totalGas = 21000; // Base transaction cost
    
    switch(operation) {
        case 'logAuditHash':
            // Function call overhead
            totalGas += GAS_COSTS.CALL;
            
            // Parameter validation
            totalGas += GAS_COSTS.SLOAD * 2; // Check hash != 0, eventType != empty
            totalGas += GAS_COSTS.SLOAD; // Check !hashExists[hash]
            
            // Storage operations
            totalGas += GAS_COSTS.SSTORE; // hashExists[hash] = true
            totalGas += GAS_COSTS.SSTORE; // Add to auditHashEntries array
            
            // Event emission
            totalGas += GAS_COSTS.EVENT_LOG_BASE;
            totalGas += GAS_COSTS.EVENT_LOG_TOPIC * 3; // hash, eventType, loggedBy
            totalGas += GAS_COSTS.EVENT_LOG_DATA * 32; // timestamp
            
            break;
            
        case 'logCriticalEvent':
            // Function call overhead
            totalGas += GAS_COSTS.CALL;
            
            // Parameter validation
            totalGas += GAS_COSTS.SLOAD * 2; // Check eventType != empty, userId != empty
            
            // Storage operations
            totalGas += GAS_COSTS.SSTORE; // Add to criticalEventEntries array
            
            // Event emission
            totalGas += GAS_COSTS.EVENT_LOG_BASE;
            totalGas += GAS_COSTS.EVENT_LOG_TOPIC * 2; // eventType, userId
            totalGas += GAS_COSTS.EVENT_LOG_DATA * (params.detailsLength || 100); // details string
            
            break;
            
        case 'logAdminApproval':
            // Function call overhead
            totalGas += GAS_COSTS.CALL;
            
            // Parameter validation
            totalGas += GAS_COSTS.SLOAD * 4; // Check all string parameters
            
            // Storage operations
            totalGas += GAS_COSTS.SSTORE; // Add to adminApprovalEntries array
            
            // Event emission
            totalGas += GAS_COSTS.EVENT_LOG_BASE;
            totalGas += GAS_COSTS.EVENT_LOG_TOPIC * 5; // approvalId, eventType, userId, approverId, approved
            totalGas += GAS_COSTS.EVENT_LOG_DATA * (params.detailsLength || 100); // details string
            totalGas += GAS_COSTS.EVENT_LOG_DATA * 32; // timestamp
            
            break;
            
        case 'verifyHash':
            // Function call overhead (read-only)
            totalGas = 0; // No transaction cost for view functions
            
            // Storage reads
            totalGas += GAS_COSTS.SLOAD; // hashExists[hash]
            totalGas += GAS_COSTS.SLOAD * 10; // Loop through auditHashEntries (average 10 entries)
            
            break;
    }
    
    return totalGas;
}

// Run performance tests
function runBlockchainPerformanceTests() {
    console.log("=== Blockchain Gas Cost Estimation ===\n");
    
    const results = [];
    
    // Test 1: logAuditHash with different scenarios
    console.log("--- Testing logAuditHash ---");
    
    const hashTests = [
        { name: "Small hash", params: {} },
        { name: "Medium hash", params: {} },
        { name: "Large hash", params: {} }
    ];
    
    hashTests.forEach(test => {
        const gas = estimateAuditLogGas('logAuditHash', test.params);
        results.push({
            function: 'logAuditHash',
            test: test.name,
            gas: gas,
            type: 'write_operation'
        });
        console.log(`${test.name}: ${gas.toLocaleString()} gas`);
    });
    
    // Test 2: logCriticalEvent with different data sizes
    console.log("\n--- Testing logCriticalEvent ---");
    
    const eventTests = [
        { name: "Small event", params: { detailsLength: 50 } },
        { name: "Medium event", params: { detailsLength: 200 } },
        { name: "Large event", params: { detailsLength: 1000 } }
    ];
    
    eventTests.forEach(test => {
        const gas = estimateAuditLogGas('logCriticalEvent', test.params);
        results.push({
            function: 'logCriticalEvent',
            test: test.name,
            gas: gas,
            type: 'write_operation'
        });
        console.log(`${test.name}: ${gas.toLocaleString()} gas`);
    });
    
    // Test 3: logAdminApproval
    console.log("\n--- Testing logAdminApproval ---");
    
    const approvalGas = estimateAuditLogGas('logAdminApproval', { detailsLength: 150 });
    results.push({
        function: 'logAdminApproval',
        test: 'Standard approval',
        gas: approvalGas,
        type: 'write_operation'
    });
    console.log(`Standard approval: ${approvalGas.toLocaleString()} gas`);
    
    // Test 4: verifyHash (read operation)
    console.log("\n--- Testing verifyHash ---");
    
    const verifyGas = estimateAuditLogGas('verifyHash', {});
    results.push({
        function: 'verifyHash',
        test: 'Hash verification',
        gas: verifyGas,
        type: 'read_operation'
    });
    console.log(`Hash verification: ${verifyGas.toLocaleString()} gas`);
    
    // Summary
    console.log("\n=== Blockchain Performance Summary ===");
    console.log("Most expensive operations:");
    results
        .sort((a, b) => b.gas - a.gas)
        .slice(0, 3)
        .forEach(result => {
            console.log(`  ${result.function} (${result.test}): ${result.gas.toLocaleString()} gas`);
        });
    
    console.log("\nCheapest operations:");
    results
        .sort((a, b) => a.gas - b.gas)
        .slice(0, 3)
        .forEach(result => {
            console.log(`  ${result.function} (${result.test}): ${result.gas.toLocaleString()} gas`);
        });
    
    return results;
}

// Run if called directly
if (require.main === module) {
    runBlockchainPerformanceTests();
}

module.exports = {
    estimateAuditLogGas,
    runBlockchainPerformanceTests
};
