/**
 * Extract contract addresses from Truffle migration artifacts
 * Run this after deploying contracts to get addresses for .env files
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build', 'contracts');

function extractAddresses() {
  const addresses = {};
  
  const contracts = ['AccessControl', 'UserRegistry', 'DocumentStorage', 'AuditLog'];
  
  contracts.forEach(contractName => {
    const artifactPath = path.join(buildDir, `${contractName}.json`);
    
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // Get address from networks (use the first network found)
        const networks = artifact.networks || {};
        const networkKeys = Object.keys(networks);
        
        if (networkKeys.length > 0) {
          const network = networks[networkKeys[0]];
          if (network.address) {
            addresses[contractName] = network.address;
          }
        }
      } catch (error) {
        console.warn(`Could not extract address for ${contractName}:`, error.message);
      }
    }
  });
  
  return addresses;
}

// Also check migration artifacts
function extractFromMigrations() {
  const addresses = {};
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Try to read from migration state (if available)
  // Note: Truffle stores deployment info in build/contracts/*.json files
  // The addresses are in the networks section
  
  return addresses;
}

if (require.main === module) {
  console.log('📋 Extracting contract addresses...\n');
  
  const addresses = extractAddresses();
  
  if (Object.keys(addresses).length === 0) {
    console.log('⚠️  No contract addresses found.');
    console.log('   Make sure you have deployed contracts first:');
    console.log('   npm run migrate --network ganache\n');
    process.exit(1);
  }
  
  console.log('✅ Contract addresses found:\n');
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  console.log('\n📝 Add these to audit-service/.env:\n');
  console.log(`ACCESS_CONTROL_CONTRACT_ADDRESS=${addresses.AccessControl || '0x...'}`);
  console.log(`USER_REGISTRY_CONTRACT_ADDRESS=${addresses.UserRegistry || '0x...'}`);
  console.log(`DOCUMENT_STORAGE_CONTRACT_ADDRESS=${addresses.DocumentStorage || '0x...'}`);
  console.log(`AUDIT_LOG_CONTRACT_ADDRESS=${addresses.AuditLog || '0x...'}`);
  console.log(`AUDIT_CONTRACT_ADDRESS=${addresses.AuditLog || '0x...'}`);
  console.log('\n💡 Tip: Copy the addresses from the migration output for the most accurate results.');
}

module.exports = { extractAddresses };
