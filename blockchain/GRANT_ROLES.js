/**
 * Script to grant roles in AccessControl contract
 * Run this after deploying contracts
 *
 * Grants AUDITOR_ROLE (and other roles) to the account used by the audit-service,
 * i.e. the address derived from DEPLOYER_PRIVATE_KEY. If DEPLOYER_PRIVATE_KEY is
 * not set, grants to the first Ganache account (accounts[0]).
 *
 * Usage (from project root):
 *   cd blockchain && npm install && node GRANT_ROLES.js
 *
 * Or from project root with npx:
 *   npx --prefix blockchain node GRANT_ROLES.js
 *   (requires blockchain/node_modules; run "npm install" in blockchain first)
 *
 * Or use Truffle console:
 *   truffle console --network ganache
 *   Then copy-paste the code below
 */

const path = require('path');
const { Web3 } = require('web3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function grantRoles() {
  const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
  const web3 = new Web3(rpcUrl);
  console.log('RPC:', rpcUrl);
  if (process.env.ACCESS_CONTROL_CONTRACT_ADDRESS) {
    console.log('Using ACCESS_CONTROL_CONTRACT_ADDRESS from .env');
  }
  console.log('');

  // Get accounts (unlocked in Ganache)
  const accounts = await web3.eth.getAccounts();
  const owner = accounts[0]; // Contract owner is whoever deployed (first account)

  // Account that receives roles: same as audit-service (DEPLOYER_PRIVATE_KEY) so it can log to chain
  let grantToAddress = owner;
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    try {
      const serviceAccount = web3.eth.accounts.privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY.trim());
      grantToAddress = serviceAccount.address;
      console.log('Granting roles to audit-service account (from DEPLOYER_PRIVATE_KEY):', grantToAddress);
    } catch (e) {
      console.warn('⚠ DEPLOYER_PRIVATE_KEY invalid, granting to first account:', e.message);
    }
  } else {
    console.log('No DEPLOYER_PRIVATE_KEY set; granting roles to first account:', grantToAddress);
  }
  console.log('(Contract owner / tx sender):', owner);
  console.log('');

  // Load contract ABI and address (prefer .env so Docker-deployed contract is used)
  const fs = require('fs');
  const artifactPath = path.join(__dirname, 'build', 'contracts', 'AccessControl.json');

  let contractAddress = process.env.ACCESS_CONTROL_CONTRACT_ADDRESS;
  if (!contractAddress && fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const networks = artifact.networks || {};
    const networkKeys = Object.keys(networks);
    if (networkKeys.length > 0) {
      contractAddress = networks[networkKeys[0]].address;
    }
  }
  if (!contractAddress) {
    console.error('❌ AccessControl address not found. Set ACCESS_CONTROL_CONTRACT_ADDRESS in .env or deploy contracts first.');
    process.exit(1);
  }

  if (!fs.existsSync(artifactPath)) {
    console.error('❌ AccessControl ABI not found at', artifactPath);
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const contract = new web3.eth.Contract(artifact.abi, contractAddress);
  
  console.log('AccessControl contract address:', contractAddress);
  console.log('\nGranting roles...\n');
  
  try {
    // Get role constants
    const AUDITOR_ROLE = await contract.methods.AUDITOR_ROLE().call();
    const USER_REGISTRAR_ROLE = await contract.methods.USER_REGISTRAR_ROLE().call();
    const DOCUMENT_MANAGER_ROLE = await contract.methods.DOCUMENT_MANAGER_ROLE().call();

    const hasAuditorAlready = await contract.methods.hasRole(grantToAddress, AUDITOR_ROLE).call();
    const hasUserRegistrarAlready = await contract.methods.hasRole(grantToAddress, USER_REGISTRAR_ROLE).call();
    const hasDocManagerAlready = await contract.methods.hasRole(grantToAddress, DOCUMENT_MANAGER_ROLE).call();

    if (hasAuditorAlready && hasUserRegistrarAlready && hasDocManagerAlready) {
      console.log('✅ Account already has all roles (e.g. deployer). Nothing to grant.');
    } else {
      if (!hasAuditorAlready) {
        await contract.methods.grantRole(grantToAddress, AUDITOR_ROLE).send({ from: owner });
        console.log('✅ Granted AUDITOR_ROLE');
      } else {
        console.log('✅ AUDITOR_ROLE (already had it)');
      }
      if (!hasUserRegistrarAlready) {
        await contract.methods.grantRole(grantToAddress, USER_REGISTRAR_ROLE).send({ from: owner });
        console.log('✅ Granted USER_REGISTRAR_ROLE');
      } else {
        console.log('✅ USER_REGISTRAR_ROLE (already had it)');
      }
      if (!hasDocManagerAlready) {
        await contract.methods.grantRole(grantToAddress, DOCUMENT_MANAGER_ROLE).send({ from: owner });
        console.log('✅ Granted DOCUMENT_MANAGER_ROLE');
      } else {
        console.log('✅ DOCUMENT_MANAGER_ROLE (already had it)');
      }
    }
    
    // Verify roles
    console.log('\n✅ Verifying roles...\n');
    const hasAuditor = await contract.methods.hasRole(grantToAddress, AUDITOR_ROLE).call();
    const hasUserRegistrar = await contract.methods.hasRole(grantToAddress, USER_REGISTRAR_ROLE).call();
    const hasDocManager = await contract.methods.hasRole(grantToAddress, DOCUMENT_MANAGER_ROLE).call();
    
    console.log('Roles verification for', grantToAddress + ':');
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
