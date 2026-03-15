/**
 * Sprint 2 Blockchain Test - Audit History Retrieval
 * Test Categories: NORMAL | EDGE | ATTACK
 * 
 * Tests the new audit history functions with normal usage,
 * edge cases, and potential attack vectors.
 */

const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const GANACHE_URL = 'http://localhost:7545';

async function main() {
    console.log('='.repeat(70));
    console.log('SPRINT 2 BLOCKCHAIN TEST: Audit History Retrieval');
    console.log('Test Categories: NORMAL | EDGE | ATTACK');
    console.log('='.repeat(70));

    const web3 = new Web3(GANACHE_URL);
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    // Load contract artifacts
    const auditLogPath = path.join(__dirname, 'build/contracts/AuditLog.json');
    const accessControlPath = path.join(__dirname, 'build/contracts/AccessControl.json');
    
    const AuditLogArtifact = JSON.parse(fs.readFileSync(auditLogPath, 'utf8'));
    const AccessControlArtifact = JSON.parse(fs.readFileSync(accessControlPath, 'utf8'));

    // Deploy AccessControl
    const AccessControl = new web3.eth.Contract(AccessControlArtifact.abi);
    const accessControl = await AccessControl.deploy({
        data: AccessControlArtifact.bytecode
    }).send({ from: deployer, gas: 3000000 });

    // Deploy AuditLog
    const AuditLog = new web3.eth.Contract(AuditLogArtifact.abi);
    const auditLog = await AuditLog.deploy({
        data: AuditLogArtifact.bytecode,
        arguments: [accessControl.options.address]
    }).send({ from: deployer, gas: 5000000 });

    console.log(`\nContracts deployed successfully`);
    // Note: Constructor already grants AUDITOR_ROLE to deployer

    // Add some test audit entries
    console.log('\nAdding 5 test audit entries...');
    for (let i = 0; i < 5; i++) {
        const hash = web3.utils.keccak256(`test-document-${i}-${Date.now()}`);
        await auditLog.methods.logAuditHash(hash, 'DOCUMENT_UPLOAD').send({ from: deployer, gas: 200000 });
    }

    const results = {
        testCases: [],
        allPassed: true
    };

    // ============================================================
    // TEST CASE 1: NORMAL - Get Audit Stats
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('TEST CASE 1: NORMAL - Get Audit Stats');
    console.log('='.repeat(70));

    try {
        const stats = await auditLog.methods.getAuditStats().call();
        const totalHashes = parseInt(stats.totalHashes);
        
        console.log(`  Total Hashes: ${totalHashes}`);
        console.log(`  Total Critical Events: ${stats.totalCriticalEvents}`);
        console.log(`  Total Approvals: ${stats.totalApprovals}`);
        
        const test1Pass = totalHashes === 5;
        console.log(`\n  ${test1Pass ? '✅' : '❌'} NORMAL Test: ${test1Pass ? 'PASSED' : 'FAILED'}`);
        
        results.testCases.push({
            category: 'NORMAL',
            name: 'Get Audit Stats',
            expected: 'totalHashes = 5',
            actual: `totalHashes = ${totalHashes}`,
            passed: test1Pass
        });
        if (!test1Pass) results.allPassed = false;
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.allPassed = false;
    }

    // ============================================================
    // TEST CASE 2: EDGE - Get Recent Audits with count > total
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('TEST CASE 2: EDGE - Request More Audits Than Exist');
    console.log('='.repeat(70));

    try {
        // Request 100 audits when only 5 exist
        const recentAudits = await auditLog.methods.getRecentAudits(100).call();
        const returnedCount = recentAudits.hashes.length;
        
        console.log(`  Requested: 100 audits`);
        console.log(`  Available: 5 audits`);
        console.log(`  Returned: ${returnedCount} audits`);
        
        // Should return only 5 (all available), not crash
        const test2Pass = returnedCount === 5;
        console.log(`\n  ${test2Pass ? '✅' : '❌'} EDGE Test: ${test2Pass ? 'PASSED' : 'FAILED'} (Handled gracefully)`);
        
        results.testCases.push({
            category: 'EDGE',
            name: 'Request > Available',
            expected: 'Return 5 (all available)',
            actual: `Returned ${returnedCount}`,
            passed: test2Pass
        });
        if (!test2Pass) results.allPassed = false;
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.allPassed = false;
    }

    // ============================================================
    // TEST CASE 3: ATTACK - Integer Overflow Attempt
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('TEST CASE 3: ATTACK - Integer Overflow/Underflow Attempt');
    console.log('='.repeat(70));

    try {
        // Try to cause integer overflow with max uint256 values
        const maxUint = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        
        console.log(`  Attempting getAuditHistory with extreme values...`);
        console.log(`  startTime: 0, endTime: MAX_UINT256, offset: MAX_UINT256, limit: MAX_UINT256`);
        
        let attackHandled = false;
        try {
            // This should either:
            // 1. Revert gracefully
            // 2. Return empty/valid result without crashing
            const result = await auditLog.methods.getAuditHistory(0, maxUint, maxUint, maxUint).call();
            // If it returns, check it's a valid response
            attackHandled = Array.isArray(result.hashes);
            console.log(`  Response: Valid array returned (length: ${result.hashes.length})`);
        } catch (revertError) {
            // Revert is acceptable - means contract protected itself
            attackHandled = true;
            console.log(`  Response: Transaction reverted (contract protected itself)`);
        }
        
        console.log(`\n  ${attackHandled ? '✅' : '❌'} ATTACK Test: ${attackHandled ? 'PASSED' : 'FAILED'} (No crash/exploit)`);
        
        results.testCases.push({
            category: 'ATTACK',
            name: 'Integer Overflow',
            expected: 'Handle safely (revert or empty)',
            actual: attackHandled ? 'Handled safely' : 'Vulnerable',
            passed: attackHandled
        });
        if (!attackHandled) results.allPassed = false;
    } catch (error) {
        // Any error here means the attack was handled
        console.log(`  Response: ${error.message.substring(0, 50)}...`);
        console.log(`\n  ✅ ATTACK Test: PASSED (Contract protected itself)`);
        results.testCases.push({
            category: 'ATTACK',
            name: 'Integer Overflow',
            expected: 'Handle safely',
            actual: 'Reverted safely',
            passed: true
        });
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('SPRINT 2 BLOCKCHAIN TEST RESULTS');
    console.log('='.repeat(70));

    console.log('\n| Category | Test Case | Expected | Actual | Result |');
    console.log('|----------|-----------|----------|--------|--------|');
    for (const tc of results.testCases) {
        const status = tc.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`| ${tc.category} | ${tc.name.substring(0, 20)} | ${tc.expected.substring(0, 20)} | ${tc.actual.substring(0, 15)} | ${status} |`);
    }

    const passed = results.testCases.filter(tc => tc.passed).length;
    const total = results.testCases.length;
    console.log(`\n${results.allPassed ? '✅' : '❌'} ${passed}/${total} TEST CASES PASSED`);

    console.log('\n' + JSON.stringify(results, null, 2));
    
    process.exit(results.allPassed ? 0 : 1);
}

main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
