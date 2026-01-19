/**
 * Script to grant roles in AccessControl contract
 * Run this after deploying contracts
 * 
 * Usage:
 *   node GRANT_ROLES.js
 * 
 * Or use Truffle console:
 *   truffle console --network ganache
 *   Then copy-paste the code below
 */

const Web3 = require('web3');
require('dotenv').config();

async function grantRoles() {
  const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
  const web3 = new Web3(rpcUrl);
  
  // Get accounts
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  
  console.log('Deployer address:', deployer);
  
  // Load contract ABI and address
  const fs = require('fs');
  const path = require('path');
  const artifactPath = path.join(__dirname, 'build', 'contracts', 'AccessControl.json');
  
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ AccessControl contract not found. Deploy contracts first!');
    process.exit(1);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const networks = artifact.networks;
  const networkKeys = Object.keys(networks);
  
  if (networkKeys.length === 0) {
    console.error('❌ No deployed AccessControl contract found. Deploy contracts first!');
    process.exit(1);
  }
  
  const contractAddress = networks[networkKeys[0]].address;
  const contract = new web3.eth.Contract(artifact.abi, contractAddress);
  
  console.log('AccessControl contract address:', contractAddress);
  console.log('\nGranting roles...\n');
  
  try {
    // Get role constants
    const AUDITOR_ROLE = await contract.methods.AUDITOR_ROLE().call();
    const USER_REGISTRAR_ROLE = await contract.methods.USER_REGISTRAR_ROLE().call();
    const DOCUMENT_MANAGER_ROLE = await contract.methods.DOCUMENT_MANAGER_ROLE().call();
    
    // Grant roles
    await contract.methods.grantRole(deployer, AUDITOR_ROLE).send({ from: deployer });
    console.log('✅ Granted AUDITOR_ROLE');
    
    await contract.methods.grantRole(deployer, USER_REGISTRAR_ROLE).send({ from: deployer });
    console.log('✅ Granted USER_REGISTRAR_ROLE');
    
    await contract.methods.grantRole(deployer, DOCUMENT_MANAGER_ROLE).send({ from: deployer });
    console.log('✅ Granted DOCUMENT_MANAGER_ROLE');
    
    // Verify roles
    console.log('\n✅ Verifying roles...\n');
    const hasAuditor = await contract.methods.hasRole(deployer, AUDITOR_ROLE).call();
    const hasUserRegistrar = await contract.methods.hasRole(deployer, USER_REGISTRAR_ROLE).call();
    const hasDocManager = await contract.methods.hasRole(deployer, DOCUMENT_MANAGER_ROLE).call();
    
    console.log('Roles verification:');
    console.log('  AUDITOR_ROLE:', hasAuditor);
    console.log('  USER_REGISTRAR_ROLE:', hasUserRegistrar);
    console.log('  DOCUMENT_MANAGER_ROLE:', hasDocManager);
    
    if (hasAuditor && hasUserRegistrar && hasDocManager) {
      console.log('\n🎉 All roles granted successfully!');
    } else {
      console.log('\n⚠️  Some roles were not granted. Check the output above.');
    }
  } catch (error) {
    console.error('❌ Error granting roles:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  grantRoles().catch(console.error);
}

module.exports = { grantRoles };
