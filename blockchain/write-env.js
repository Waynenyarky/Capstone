const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const buildDir = path.join(__dirname, 'build', 'contracts');
const envPath = process.argv[2] || path.join(__dirname, '..', '.env');

const CONTRACT_KEYS = {
  AccessControl: 'ACCESS_CONTROL_CONTRACT_ADDRESS',
  UserRegistry: 'USER_REGISTRY_CONTRACT_ADDRESS',
  DocumentStorage: 'DOCUMENT_STORAGE_CONTRACT_ADDRESS',
  AuditLog: 'AUDIT_LOG_CONTRACT_ADDRESS',
};

/**
 * Get network id from RPC (net_version) so we match Truffle's artifact key. Never write addresses from a different chain.
 * When RPC is unreachable, fall back to last network key (for offline/CI).
 */
async function extractAddresses() {
  const rpcUrl = process.env.GANACHE_RPC_URL || process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545';
  let targetNetworkId = null;
  try {
    const { Web3 } = require('web3');
    const web3 = new Web3(rpcUrl);
    // Use net_version (same as Truffle) so artifact key matches; getChainId() can differ in Ganache
    const res = await web3.eth.provider?.request?.({ method: 'net_version' });
    targetNetworkId = (res && res.result !== undefined && res.result !== null) ? String(res.result) : String(await web3.eth.getChainId());
  } catch (_) {}

  const addresses = {};
  for (const contractName of Object.keys(CONTRACT_KEYS)) {
    const artifactPath = path.join(buildDir, `${contractName}.json`);
    if (!fs.existsSync(artifactPath)) continue;
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const networks = artifact.networks || {};
      const networkKeys = Object.keys(networks);
      if (networkKeys.length === 0) continue;
      let key;
      if (targetNetworkId && networks[targetNetworkId] && networks[targetNetworkId].address) {
        key = targetNetworkId;
      } else if (targetNetworkId) {
        // Current network id not in artifact — don't use another network (would write wrong addresses)
        continue;
      } else {
        key = networkKeys[networkKeys.length - 1];
      }
      const network = networks[key];
      if (network && network.address) {
        addresses[CONTRACT_KEYS[contractName]] = network.address;
      }
    } catch (error) {
      console.warn(`Could not extract address for ${contractName}:`, error.message);
    }
  }

  if (addresses.AUDIT_LOG_CONTRACT_ADDRESS) {
    addresses.AUDIT_CONTRACT_ADDRESS = addresses.AUDIT_LOG_CONTRACT_ADDRESS;
  }

  if (targetNetworkId && Object.keys(addresses).length < 4) {
    console.error(`Current chain (id ${targetNetworkId}) has no deployment in build/contracts. Run: cd blockchain && npm run setup`);
    process.exit(1);
  }

  return addresses;
}

function upsertEnvVars(contents, updates) {
  const lines = contents.split(/\r?\n/);
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return line;
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      seen.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  Object.keys(updates).forEach((key) => {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${updates[key]}`);
    }
  });

  return nextLines.filter((line, idx, arr) => !(line === '' && arr[idx - 1] === '')).join('\n');
}

async function main() {
  const updates = await extractAddresses();
  if (Object.keys(updates).length === 0) {
    console.error('No contract addresses found in build/contracts. Skipping .env update.');
    process.exit(1);
  }

  let existing = '';
  if (fs.existsSync(envPath)) {
    existing = fs.readFileSync(envPath, 'utf8');
  }

  const next = upsertEnvVars(existing, updates);
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, next.endsWith('\n') ? next : `${next}\n`);

  console.log(`Updated ${envPath} with contract addresses:`);
  Object.entries(updates).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
