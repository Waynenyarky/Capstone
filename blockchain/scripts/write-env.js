const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build', 'contracts');
const envPath = process.argv[2] || path.join(__dirname, '..', '..', '.env');

const CONTRACT_KEYS = {
  AccessControl: 'ACCESS_CONTROL_CONTRACT_ADDRESS',
  UserRegistry: 'USER_REGISTRY_CONTRACT_ADDRESS',
  DocumentStorage: 'DOCUMENT_STORAGE_CONTRACT_ADDRESS',
  AuditLog: 'AUDIT_LOG_CONTRACT_ADDRESS',
};

function extractAddresses() {
  const addresses = {};
  Object.keys(CONTRACT_KEYS).forEach((contractName) => {
    const artifactPath = path.join(buildDir, `${contractName}.json`);
    if (!fs.existsSync(artifactPath)) return;
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const networks = artifact.networks || {};
      const networkKeys = Object.keys(networks);
      if (networkKeys.length > 0) {
        const network = networks[networkKeys[0]];
        if (network.address) {
          addresses[CONTRACT_KEYS[contractName]] = network.address;
        }
      }
    } catch (error) {
      console.warn(`Could not extract address for ${contractName}:`, error.message);
    }
  });

  if (addresses.AUDIT_LOG_CONTRACT_ADDRESS) {
    addresses.AUDIT_CONTRACT_ADDRESS = addresses.AUDIT_LOG_CONTRACT_ADDRESS;
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

function main() {
  const updates = extractAddresses();
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

main();
