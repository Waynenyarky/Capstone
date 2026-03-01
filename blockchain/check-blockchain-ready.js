/**
 * Check if the blockchain is ready for audit-service (RPC reachable, contracts deployed, AUDITOR_ROLE granted).
 * Exits 0 if ready, 1 with a message to stderr if not.
 * Loads .env from project root (../.env). Run from blockchain/ directory.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const rpcUrl = process.env.GANACHE_RPC_URL || process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545';
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const accessControlAddress = process.env.ACCESS_CONTROL_CONTRACT_ADDRESS;

function fail(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

if (!privateKey || !accessControlAddress) {
  fail('Blockchain audit logging will not work: set DEPLOYER_PRIVATE_KEY and ACCESS_CONTROL_CONTRACT_ADDRESS in .env');
}

const fs = require('fs');
const artifactPath = path.join(__dirname, 'build', 'contracts', 'AccessControl.json');
if (!fs.existsSync(artifactPath)) {
  fail('Blockchain audit logging will not work: run migrations first (cd blockchain && npm run setup).');
}

async function main() {
  const { Web3 } = require('web3');
  const web3 = new Web3(rpcUrl);
  let account;
  try {
    account = web3.eth.accounts.privateKeyToAccount(privateKey.trim());
  } catch (e) {
    fail('Blockchain audit logging will not work: invalid DEPLOYER_PRIVATE_KEY in .env');
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const contract = new web3.eth.Contract(artifact.abi, accessControlAddress);
  try {
    const code = await web3.eth.getCode(accessControlAddress);
    if (!code || code === '0x' || code === '0x0') {
      fail('Blockchain audit logging will not work: contracts not deployed at addresses in .env. Run: cd blockchain && npm run setup');
    }
    const AUDITOR_ROLE = await contract.methods.AUDITOR_ROLE().call();
    const hasRole = await contract.methods.hasRole(account.address, AUDITOR_ROLE).call();
    if (!hasRole) {
      fail('Blockchain audit logging will not work: audit-service account does not have AUDITOR_ROLE. Run: cd blockchain && npm run setup');
    }
  } catch (e) {
    if (e.message && (e.message.includes('ECONNREFUSED') || e.message.includes('connect'))) {
      fail('Blockchain audit logging will not work: cannot reach Ganache at ' + rpcUrl + '. Start Ganache (or use ./start.sh --ganache-gui after starting Ganache GUI).');
    }
    if (e.message && e.message.includes("Returned values aren't valid")) {
      fail('Blockchain audit logging will not work: contract addresses in .env do not match the current chain. Run: cd blockchain && npm run setup');
    }
    fail('Blockchain audit logging will not work: ' + (e.message || String(e)));
  }
  process.exit(0);
}

main();
