#!/usr/bin/env node
/**
 * Auto-Open Services Script (Node.js version)
 * 
 * This script waits for Docker services to be ready, then automatically
 * opens browser tabs for easy access - no need to remember URLs!
 * 
 * Usage:
 *   node scripts/open-services.js
 *   # Or after docker-compose up:
 *   docker-compose up -d && node scripts/open-services.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');
const { open } = require('open'); // npm install open

const execAsync = promisify(exec);

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.request({ host, port, timeout }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function checkDockerContainer(containerName) {
  try {
    const { stdout } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
    return stdout.trim() === containerName;
  } catch {
    return false;
  }
}

async function waitForService(name, checkFn, maxAttempts = 30) {
  log(`   Waiting for ${name}...`, 'yellow');
  for (let i = 1; i <= maxAttempts; i++) {
    if (await checkFn()) {
      log(`✅ ${name} is ready`, 'green');
      return true;
    }
    if (i < maxAttempts) {
      process.stdout.write(`   Attempt ${i}/${maxAttempts}\r`);
      await sleep(2000);
    }
  }
  log(`❌ ${name} not ready after ${maxAttempts} attempts`, 'red');
  return false;
}

async function openBrowser(url, name) {
  try {
    log(`   ✅ Opening ${name}...`, 'green');
    await open(url);
    await sleep(1000);
  } catch (error) {
    log(`   ⚠️  Could not open ${url}`, 'yellow');
  }
}

async function main() {
  log('\n🚀 Waiting for services to be ready...\n', 'cyan');

  // Check Docker services
  log('📦 Checking Docker services...', 'blue');

  await waitForService('MongoDB', () => checkDockerContainer('capstone-mongodb'));
  await waitForService('IPFS', () => checkDockerContainer('capstone-ipfs'));
  await waitForService('Ganache', () => checkDockerContainer('capstone-ganache'));

  log('\n⏳ Giving services a moment to fully initialize...', 'cyan');
  await sleep(3000);

  log('\n🌐 Opening browser tabs...\n', 'green');

  // Open IPFS Gateway with a test file (IPFS logo) to verify it works
  // The root URL doesn't work, so we use a known test CID
  await openBrowser('http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', 'IPFS Gateway (Test)');

  // Open IPFS Web UI
  await openBrowser('http://localhost:5001/webui', 'IPFS Web UI');

  // Create and open MongoDB connection helper
  const fs = require('fs');
  const path = require('path');
  const tempDir = require('os').tmpdir();
  const htmlPath = path.join(tempDir, 'mongodb-connection-info.html');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>MongoDB Connection Info</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #4CAF50; }
        .info-box { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 5px 0; }
        .button:hover { background: #45a049; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 MongoDB Connection Info</h1>
        
        <div class="info-box">
            <h3>Connection String:</h3>
            <code>mongodb://localhost:27017</code>
        </div>
        
        <div class="info-box">
            <h3>Database Name:</h3>
            <code>capstone_project</code>
        </div>
        
        <div class="info-box">
            <h3>Quick Access:</h3>
            <p><strong>MongoDB Compass:</strong> Download from <a href="https://www.mongodb.com/try/download/compass" target="_blank">mongodb.com</a></p>
            <p><strong>Command Line:</strong></p>
            <code>docker exec -it capstone-mongodb mongosh capstone_project</code>
        </div>
        
        <div class="info-box">
            <h3>Quick Queries:</h3>
            <p>Find IPFS CIDs:</p>
            <code>db.users.find({avatarIpfsCid: {$ne: ''}}, {email: 1, avatarIpfsCid: 1})</code>
        </div>
        
        <div class="info-box">
            <h3>🌐 Service Links:</h3>
            <p><strong>IPFS Gateway:</strong> <a href="http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" target="_blank">http://localhost:8080/ipfs/{CID}</a></p>
            <p><small>Replace {CID} with your actual IPFS CID</small></p>
            <p><strong>API Services:</strong></p>
            <p>
                <a href="http://localhost:3001/api/health" target="_blank">Auth Service</a> |
                <a href="http://localhost:3002/api/health" target="_blank">Business Service</a> |
                <a href="http://localhost:3003/api/health" target="_blank">Admin Service</a> |
                <a href="http://localhost:3004/api/health" target="_blank">Audit Service</a>
            </p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  await openBrowser(`file://${htmlPath}`, 'MongoDB Connection Info');

  // Check and open API services
  log('\n🔌 Checking API services...', 'blue');

  const services = [
    { port: 3001, name: 'Auth Service (Health Check)', path: '/api/health' },
    { port: 3002, name: 'Business Service (Health Check)', path: '/api/health' },
    { port: 3003, name: 'Admin Service (Health Check)', path: '/api/health' },
    { port: 3004, name: 'Audit Service (Health Check)', path: '/api/health' },
  ];

  for (const service of services) {
    if (await checkPort('localhost', service.port)) {
      await openBrowser(`http://localhost:${service.port}${service.path}`, service.name);
    } else {
      log(`   ⚠️  ${service.name} (${service.port}) not ready`, 'yellow');
    }
  }

  // Web frontend
  if (await checkPort('localhost', 5173)) {
    await openBrowser('http://localhost:5173', 'Web App');
  } else {
    log('   ℹ️  Web frontend not running (start with: cd web && npm run dev)', 'yellow');
  }

  log('\n✅ Done! Browser tabs should be open.\n', 'green');
  log('💡 Tip: Bookmark these pages for quick access!\n', 'cyan');

  // Clean up temp file after delay
  setTimeout(() => {
    try {
      fs.unlinkSync(htmlPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 10000);
}

// Check if 'open' package is available
try {
  require.resolve('open');
  main().catch(console.error);
} catch (e) {
  log('❌ Missing dependency: npm install open', 'red');
  log('   Or use the bash version: ./scripts/open-services.sh', 'yellow');
  process.exit(1);
}
