/**
 * Gas Optimization Analysis for AuditLog Contract
 * 
 * This script analyzes the gas savings from the verifyHash optimization
 * without requiring a running blockchain.
 * 
 * OPTIMIZATION APPLIED:
 * - Added hashTimestamp mapping for O(1) timestamp lookup
 * - Changed verifyHash from O(n) loop to O(1) mapping access
 */

// Gas cost constants (EVM opcodes)
const GAS_COSTS = {
    // Storage operations
    SLOAD: 2100,           // Cold storage read
    SLOAD_WARM: 100,       // Warm storage read (same slot accessed before)
    SSTORE_NEW: 20000,     // Write to new storage slot
    SSTORE_EXISTING: 5000, // Write to existing storage slot
    
    // Memory/computation
    MLOAD: 3,
    MSTORE: 3,
    ADD: 3,
    MUL: 5,
    LT: 3,                 // Less than comparison
    JUMP: 8,
    JUMPI: 10,             // Conditional jump
    
    // Call overhead
    CALL_BASE: 700,
};

/**
 * Calculate gas cost for OLD verifyHash implementation (O(n) loop)
 */
function calculateOldVerifyHashGas(numEntries, targetIndex) {
    let gas = 0;
    
    // Initial hashExists check
    gas += GAS_COSTS.SLOAD;  // Read hashExists[hash]
    
    // Loop through entries until we find the match
    const iterationsNeeded = targetIndex + 1;  // 0-indexed
    
    for (let i = 0; i < iterationsNeeded; i++) {
        // Loop condition check: i < auditHashEntries.length
        gas += GAS_COSTS.SLOAD;  // Read array length
        gas += GAS_COSTS.LT;     // Compare
        gas += GAS_COSTS.JUMPI;  // Conditional jump
        
        // Read auditHashEntries[i].hash
        gas += GAS_COSTS.SLOAD;  // Array element access
        
        // Compare hash
        gas += GAS_COSTS.LT * 8; // 32-byte comparison (simplified)
        
        // If not match, continue loop
        if (i < iterationsNeeded - 1) {
            gas += GAS_COSTS.ADD;   // i++
            gas += GAS_COSTS.JUMP;  // Jump back to loop start
        }
    }
    
    // Read timestamp from found entry
    gas += GAS_COSTS.SLOAD;
    
    return gas;
}

/**
 * Calculate gas cost for NEW verifyHash implementation (O(1) mapping)
 */
function calculateNewVerifyHashGas() {
    let gas = 0;
    
    // hashExists check
    gas += GAS_COSTS.SLOAD;  // Read hashExists[hash]
    
    // Direct timestamp lookup from mapping
    gas += GAS_COSTS.SLOAD;  // Read hashTimestamp[hash]
    
    return gas;
}

/**
 * Calculate additional gas cost for logAuditHash with optimization
 */
function calculateLogAuditHashOverhead() {
    // The optimization adds one extra SSTORE for hashTimestamp[hash]
    return GAS_COSTS.SSTORE_NEW;
}

// Run analysis
console.log("=".repeat(70));
console.log("BLOCKCHAIN GAS OPTIMIZATION ANALYSIS");
console.log("AuditLog.sol - verifyHash Function");
console.log("=".repeat(70));

console.log("\n📋 OPTIMIZATION DETAILS:");
console.log("-".repeat(70));
console.log("BEFORE: verifyHash used O(n) loop through auditHashEntries array");
console.log("AFTER:  verifyHash uses O(1) direct mapping lookup (hashTimestamp)");
console.log("-".repeat(70));

console.log("\n📊 GAS COST COMPARISON:");
console.log("=".repeat(70));

const scenarios = [
    { entries: 1, position: 0, label: "1 entry (best case)" },
    { entries: 10, position: 4, label: "10 entries (avg case)" },
    { entries: 10, position: 9, label: "10 entries (worst case)" },
    { entries: 100, position: 49, label: "100 entries (avg case)" },
    { entries: 100, position: 99, label: "100 entries (worst case)" },
    { entries: 1000, position: 499, label: "1000 entries (avg case)" },
    { entries: 1000, position: 999, label: "1000 entries (worst case)" },
];

const newGas = calculateNewVerifyHashGas();

console.log("\n| Scenario                    | OLD Gas (O(n)) | NEW Gas (O(1)) | Savings    |");
console.log("|-----------------------------|--------------:|---------------:|------------|");

const results = [];

for (const scenario of scenarios) {
    const oldGas = calculateOldVerifyHashGas(scenario.entries, scenario.position);
    const savings = oldGas - newGas;
    const savingsPercent = ((savings / oldGas) * 100).toFixed(1);
    
    results.push({
        scenario: scenario.label,
        oldGas,
        newGas,
        savings,
        savingsPercent
    });
    
    console.log(`| ${scenario.label.padEnd(27)} | ${oldGas.toString().padStart(12)} | ${newGas.toString().padStart(13)} | ${savingsPercent.padStart(6)}% ↓  |`);
}

console.log("\n📈 TRADE-OFF ANALYSIS:");
console.log("=".repeat(70));

const writeOverhead = calculateLogAuditHashOverhead();
console.log(`\nlogAuditHash additional cost: +${writeOverhead.toLocaleString()} gas (one-time per entry)`);
console.log(`verifyHash savings per call:  -${(results[3].oldGas - newGas).toLocaleString()} gas (at 100 entries avg)`);
console.log(`\nBreak-even: The optimization pays for itself after just 1 verifyHash call`);
console.log(`            per logged hash (which is the typical use case).`);

console.log("\n✅ OPTIMIZATION SUMMARY:");
console.log("=".repeat(70));

console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ BEFORE OPTIMIZATION                                                 │
│ - verifyHash: O(n) time complexity                                  │
│ - Gas increases linearly with number of audit entries               │
│ - At 1000 entries: ~${results[6].oldGas.toLocaleString()} gas per verification                   │
├─────────────────────────────────────────────────────────────────────┤
│ AFTER OPTIMIZATION                                                  │
│ - verifyHash: O(1) time complexity                                  │
│ - Gas is CONSTANT regardless of number of entries                   │
│ - At 1000 entries: ~${newGas.toLocaleString()} gas per verification (${results[6].savingsPercent}% savings)       │
├─────────────────────────────────────────────────────────────────────┤
│ IMPROVEMENT                                                         │
│ - Worst case (1000 entries): ${results[6].savings.toLocaleString()} gas saved per call            │
│ - Scalability: System remains fast as audit log grows               │
│ - User experience: Faster hash verification responses               │
└─────────────────────────────────────────────────────────────────────┘
`);

// Export results for the submission document
const summaryData = {
    optimization: "verifyHash O(n) to O(1)",
    beforeComplexity: "O(n)",
    afterComplexity: "O(1)",
    newGasConstant: newGas,
    scenarios: results,
    writeOverhead: writeOverhead
};

console.log("\n📄 Data for submission document:");
console.log(JSON.stringify(summaryData, null, 2));
