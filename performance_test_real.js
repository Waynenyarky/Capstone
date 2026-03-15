/**
 * REAL Performance Monitoring - Tests actual Docker services
 * This measures actual API response times, not just local code execution
 */

const http = require('http');
const https = require('https');

// Configuration for your Docker services
const SERVICES = {
    auth: 'http://localhost:3001',
    business: 'http://localhost:3002',
    admin: 'http://localhost:3003',
    audit: 'http://localhost:3004',
    lob_model: 'http://localhost:5050',
    ipfs: 'http://localhost:5001'
};

// Helper to make HTTP requests with timing
function timedRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        
        const req = http.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1_000_000;
                
                resolve({
                    statusCode: res.statusCode,
                    duration: durationMs,
                    data: data.substring(0, 200) // Truncate for display
                });
            });
        });
        
        req.on('error', (err) => {
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1_000_000;
            resolve({
                error: err.message,
                duration: durationMs
            });
        });
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function testLOBModel() {
    console.log('\n=== Testing LOB Model Service (AI) ===');
    
    const testCases = [
        { description: "Sari-sari store selling snacks and beverages", name: "Simple retail" },
        { description: "Computer repair shop with hardware sales and software installation services", name: "Medium complexity" },
        { description: "Restaurant and catering services with event planning, food delivery, and wholesale food distribution to local businesses and institutions", name: "Complex multi-line" }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.name}`);
        
        const result = await timedRequest(`${SERVICES.lob_model}/predict`, {
            method: 'POST',
            body: { description: testCase.description }
        });
        
        results.push({
            testCase: testCase.name,
            duration: result.duration,
            status: result.statusCode || 'error',
            error: result.error
        });
        
        if (result.error) {
            console.log(`  Error: ${result.error}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        } else {
            console.log(`  Status: ${result.statusCode}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        }
    }
    
    return results;
}

async function testAuditService() {
    console.log('\n=== Testing Audit Service (Blockchain) ===');
    
    const endpoints = [
        { path: '/health', name: 'Health check' },
        { path: '/api/audit/logs', name: 'Get audit logs' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        console.log(`\nTesting: ${endpoint.name}`);
        
        const result = await timedRequest(`${SERVICES.audit}${endpoint.path}`);
        
        results.push({
            endpoint: endpoint.name,
            duration: result.duration,
            status: result.statusCode || 'error',
            error: result.error
        });
        
        if (result.error) {
            console.log(`  Error: ${result.error}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        } else {
            console.log(`  Status: ${result.statusCode}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        }
    }
    
    return results;
}

async function testBusinessService() {
    console.log('\n=== Testing Business Service ===');
    
    const endpoints = [
        { path: '/health', name: 'Health check' },
        { path: '/api/business/form-definition', name: 'Get form definition' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        console.log(`\nTesting: ${endpoint.name}`);
        
        const result = await timedRequest(`${SERVICES.business}${endpoint.path}`);
        
        results.push({
            endpoint: endpoint.name,
            duration: result.duration,
            status: result.statusCode || 'error',
            error: result.error
        });
        
        if (result.error) {
            console.log(`  Error: ${result.error}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        } else {
            console.log(`  Status: ${result.statusCode}`);
            console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
        }
    }
    
    return results;
}

async function testIPFS() {
    console.log('\n=== Testing IPFS Service ===');
    
    const result = await timedRequest(`${SERVICES.ipfs}/api/v0/id`, {
        method: 'POST'
    });
    
    console.log(`\nIPFS Node ID:`);
    if (result.error) {
        console.log(`  Error: ${result.error}`);
        console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
    } else {
        console.log(`  Status: ${result.statusCode}`);
        console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
    }
    
    return [{
        endpoint: 'IPFS Node ID',
        duration: result.duration,
        status: result.statusCode || 'error',
        error: result.error
    }];
}

async function runAllTests() {
    console.log('========================================');
    console.log('REAL Performance Monitoring');
    console.log('Testing actual Docker services');
    console.log('========================================');
    
    const allResults = {
        lobModel: await testLOBModel(),
        audit: await testAuditService(),
        business: await testBusinessService(),
        ipfs: await testIPFS()
    };
    
    // Summary
    console.log('\n========================================');
    console.log('PERFORMANCE SUMMARY');
    console.log('========================================');
    
    console.log('\n| Service | Test Case | Duration | Status |');
    console.log('|---------|-----------|----------|--------|');
    
    for (const [service, results] of Object.entries(allResults)) {
        for (const result of results) {
            const name = result.testCase || result.endpoint;
            const status = result.error ? `Error: ${result.error}` : result.status;
            console.log(`| ${service} | ${name} | ${result.duration.toFixed(2)}ms | ${status} |`);
        }
    }
    
    // Identify bottlenecks
    console.log('\n========================================');
    console.log('IDENTIFIED BOTTLENECKS');
    console.log('========================================');
    
    const allFlat = [];
    for (const [service, results] of Object.entries(allResults)) {
        for (const result of results) {
            allFlat.push({
                service,
                name: result.testCase || result.endpoint,
                duration: result.duration,
                error: result.error
            });
        }
    }
    
    const sorted = allFlat.sort((a, b) => b.duration - a.duration);
    
    console.log('\nSlowest operations:');
    sorted.slice(0, 3).forEach((item, i) => {
        console.log(`${i + 1}. ${item.service} - ${item.name}: ${item.duration.toFixed(2)}ms`);
    });
    
    return allResults;
}

runAllTests().catch(console.error);
