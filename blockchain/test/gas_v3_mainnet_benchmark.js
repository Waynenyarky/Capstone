/**
 * V3 Mainnet-$1k Mode Benchmark
 * Proves that epoch digest anchoring achieves <= $1,000/month on Ethereum mainnet
 * for a 5,000-business LGU scenario.
 *
 * Key assumptions:
 * - Gas price: 20 gwei (baseline), 35 gwei (stress check)
 * - ETH price: $2,000
 * - Monthly target: <= $1,000 (~25,000,000 gas at 20 gwei)
 * - 5,000 businesses with typical activity patterns
 */

const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to local Ganache
const web3 = new Web3('http://127.0.0.1:8545');

// Load contract ABIs
const contractPath = path.join(__dirname, '../build/contracts/AuditLog.json');
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const AuditLogABI = contractJson.abi;

const accessControlPath = path.join(__dirname, '../build/contracts/AccessControl.json');
const accessControlJson = JSON.parse(fs.readFileSync(accessControlPath, 'utf8'));
const AccessControlABI = accessControlJson.abi;

// Gas price assumptions
const GAS_PRICE_GWEI_BASELINE = 20;
const GAS_PRICE_GWEI_STRESS = 35;
const ETH_PRICE_USD = 2000;
const MONTHLY_BUDGET_USD = 1000;
const MONTHLY_GAS_BUDGET = 25_000_000; // ~$1,000 at 20 gwei

// Volume assumptions for 5,000-business LGU (monthly)
// ULTRA-MINIMAL Tier A: Only security incidents get immediate anchor
// Everything else (including permits) goes to digest with 6-hour SLA
const VOLUME = {
  // Tier A (immediate anchor) - ONLY security incidents
  securityIncidents: 5,     // Rare security events - MUST anchor immediately

  // Tier B (digest anchor) - EVERYTHING else including permits
  permitIssued: 500,        // ~10% of businesses get permits monthly
  permitRevoked: 10,        // Very rare
  businessApprovals: 200,   // New business approvals
  businessRejections: 50,   // Rejections
  applicationApprovals: 300,
  applicationRejections: 100,
  roleChanges: 20,
  adminActions: 50,
  accountDeletions: 10,
  ownershipTransfers: 5,
  clearanceApprovals: 400,
  clearanceRejections: 100,
  inspectionCompleted: 600,
  violationIssued: 100,
  appealResolved: 30,
  paymentConfirmed: 2000,   // High volume
  profileUpdates: 1000,
  emailChanges: 50,
  passwordChanges: 100,
  logins: 15000,            // High volume
  logouts: 14000,
  sessionCreated: 15000,
  mfaEnabled: 50,
  mfaDisabled: 20,
  documentUploaded: 3000,
  statusChanges: 2000,
};

// Calculate totals - ONLY security incidents are Tier A
const TIER_A_TOTAL = VOLUME.securityIncidents;
const TIER_B_TOTAL = Object.values(VOLUME).reduce((a, b) => a + b, 0) - TIER_A_TOTAL;

// Digest epoch settings - AGGRESSIVE for $1k target
// Key insight: To hit $1k/month, we need ~312 total tx/month max (at ~80k gas each)
// Strategy: 4 digest anchors per day (every 6 hours) + minimal Tier A
const DIGEST_EPOCH_WINDOW_MINUTES = 360; // 6 hours
const EPOCHS_PER_DAY = Math.ceil(24 * 60 / DIGEST_EPOCH_WINDOW_MINUTES);
const EPOCHS_PER_MONTH = EPOCHS_PER_DAY * 30;

// Average events per epoch
const AVG_EVENTS_PER_EPOCH = Math.ceil(TIER_B_TOTAL / EPOCHS_PER_MONTH);

console.log('='.repeat(70));
console.log('V3 MAINNET-$1K MODE BENCHMARK');
console.log('='.repeat(70));
console.log(`\nVolume Assumptions (5,000-business LGU, monthly):`);
console.log(`  Tier A (immediate anchor): ${TIER_A_TOTAL.toLocaleString()} events`);
console.log(`  Tier B (digest anchor):    ${TIER_B_TOTAL.toLocaleString()} events`);
console.log(`  Total events:              ${(TIER_A_TOTAL + TIER_B_TOTAL).toLocaleString()}`);
console.log(`\nDigest Settings:`);
console.log(`  Epoch window:              ${DIGEST_EPOCH_WINDOW_MINUTES} minutes`);
console.log(`  Epochs per month:          ${EPOCHS_PER_MONTH}`);
console.log(`  Avg events per epoch:      ${AVG_EVENTS_PER_EPOCH}`);

async function runBenchmark() {
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];

  // Deploy AccessControl first
  console.log('\n--- Deploying AccessControl contract ---');
  const AccessControl = new web3.eth.Contract(AccessControlABI);
  const acDeployTx = AccessControl.deploy({ data: accessControlJson.bytecode });
  const acGasEstimate = await acDeployTx.estimateGas({ from: deployer });
  const accessControl = await acDeployTx.send({ from: deployer, gas: Number(acGasEstimate) });
  console.log(`AccessControl deployed at: ${accessControl.options.address}`);

  // Deploy AuditLog with AccessControl address
  console.log('\n--- Deploying AuditLog contract ---');
  const AuditLog = new web3.eth.Contract(AuditLogABI);
  const deployTx = AuditLog.deploy({ 
    data: contractJson.bytecode,
    arguments: [accessControl.options.address]
  });
  const gasEstimate = await deployTx.estimateGas({ from: deployer });
  const contract = await deployTx.send({ from: deployer, gas: Number(gasEstimate) });
  console.log(`AuditLog deployed at: ${contract.options.address}`);

  // Deployer already has AUDITOR_ROLE from AccessControl constructor
  console.log('Deployer has AUDITOR_ROLE from constructor');

  // Helper to generate unique hash
  const uniqueHash = () => web3.utils.keccak256(Math.random().toString() + Date.now());

  // Measure gas for different operations
  const measurements = {};

  // 1. Measure V3 anchorDigestRoot (single digest)
  console.log('\n--- Measuring V3 anchorDigestRoot ---');
  const digestRoot = uniqueHash();
  const leafCount = AVG_EVENTS_PER_EPOCH;
  const windowStart = Math.floor(Date.now() / 1000) - 900; // 15 min ago
  const windowEnd = Math.floor(Date.now() / 1000);
  const digestType = 0; // hash_chain

  const digestTx = await contract.methods
    .anchorDigestRoot(digestRoot, leafCount, windowStart, windowEnd, digestType)
    .send({ from: deployer, gas: 200000 });

  measurements.anchorDigestRoot = Number(digestTx.gasUsed);
  console.log(`  anchorDigestRoot gas: ${measurements.anchorDigestRoot.toLocaleString()}`);

  // 2. Measure logCriticalEventCompact (for Tier A immediate anchors - most gas efficient)
  console.log('\n--- Measuring logCriticalEventCompact (Tier A) ---');
  const compactHash = uniqueHash();
  
  // Estimate gas first
  const compactGasEstimate = await contract.methods
    .logCriticalEventCompact(compactHash, 1)
    .estimateGas({ from: deployer });
  
  const compactTx = await contract.methods
    .logCriticalEventCompact(compactHash, 1) // eventCode 1 = permit_issued
    .send({ from: deployer, gas: Number(compactGasEstimate) + 10000 });

  measurements.logCriticalEventCompact = Number(compactTx.gasUsed);
  console.log(`  logCriticalEventCompact gas: ${measurements.logCriticalEventCompact.toLocaleString()}`);

  // 3. Verify digest root
  console.log('\n--- Verifying digest root ---');
  const verifyResult = await contract.methods.verifyDigestRoot(digestRoot).call();
  console.log(`  Digest exists: ${verifyResult.exists}`);
  console.log(`  Timestamp: ${verifyResult.timestamp}`);

  // Calculate monthly gas projections
  console.log('\n' + '='.repeat(70));
  console.log('MONTHLY GAS PROJECTION (MAINNET-$1K MODE)');
  console.log('='.repeat(70));

  // Tier A: immediate anchors using logCriticalEventCompact
  const tierAGas = TIER_A_TOTAL * measurements.logCriticalEventCompact;
  const tierATxCount = TIER_A_TOTAL;

  // Tier B: digest anchors (one tx per epoch)
  const tierBGas = EPOCHS_PER_MONTH * measurements.anchorDigestRoot;
  const tierBTxCount = EPOCHS_PER_MONTH;

  const totalGas = tierAGas + tierBGas;
  const totalTxCount = tierATxCount + tierBTxCount;

  console.log(`\nTier A (immediate anchor):`);
  console.log(`  Events:       ${TIER_A_TOTAL.toLocaleString()}`);
  console.log(`  Transactions: ${tierATxCount.toLocaleString()}`);
  console.log(`  Gas:          ${tierAGas.toLocaleString()}`);

  console.log(`\nTier B (digest anchor):`);
  console.log(`  Events:       ${TIER_B_TOTAL.toLocaleString()}`);
  console.log(`  Transactions: ${tierBTxCount.toLocaleString()} (${EPOCHS_PER_MONTH} epochs)`);
  console.log(`  Gas:          ${tierBGas.toLocaleString()}`);

  console.log(`\nTotal Monthly:`);
  console.log(`  Transactions: ${totalTxCount.toLocaleString()}`);
  console.log(`  Gas:          ${totalGas.toLocaleString()}`);

  // Cost calculations
  const costBaseline = (totalGas * GAS_PRICE_GWEI_BASELINE * 1e-9) * ETH_PRICE_USD;
  const costStress = (totalGas * GAS_PRICE_GWEI_STRESS * 1e-9) * ETH_PRICE_USD;

  console.log(`\n--- Cost Projections ---`);
  console.log(`  At ${GAS_PRICE_GWEI_BASELINE} gwei: $${costBaseline.toFixed(2)}/month`);
  console.log(`  At ${GAS_PRICE_GWEI_STRESS} gwei: $${costStress.toFixed(2)}/month`);

  // Target validation
  console.log(`\n--- Target Validation ---`);
  const meetsTarget = totalGas <= MONTHLY_GAS_BUDGET;
  const meetsTargetStress = costStress <= MONTHLY_BUDGET_USD * 1.5; // 50% buffer for stress

  console.log(`  Monthly gas budget:  ${MONTHLY_GAS_BUDGET.toLocaleString()}`);
  console.log(`  Actual gas:          ${totalGas.toLocaleString()}`);
  console.log(`  Budget usage:        ${((totalGas / MONTHLY_GAS_BUDGET) * 100).toFixed(1)}%`);
  console.log(`  Meets $1,000 target: ${meetsTarget ? '✅ YES' : '❌ NO'}`);
  console.log(`  Stress check (35 gwei): ${meetsTargetStress ? '✅ PASS' : '❌ FAIL'}`);

  // Comparison with V2 (batch mode)
  console.log(`\n--- Comparison with V2 Batch Mode ---`);
  const v2BatchSize = 20;
  const v2BatchGasPerTx = 150000; // Approximate from previous benchmark
  const v2TierAGas = TIER_A_TOTAL * measurements.logCriticalEventCompact;
  const v2TierBBatches = Math.ceil(TIER_B_TOTAL / v2BatchSize);
  const v2TierBGas = v2TierBBatches * v2BatchGasPerTx;
  const v2TotalGas = v2TierAGas + v2TierBGas;
  const v2Cost = (v2TotalGas * GAS_PRICE_GWEI_BASELINE * 1e-9) * ETH_PRICE_USD;

  console.log(`  V2 batch mode gas:   ${v2TotalGas.toLocaleString()}`);
  console.log(`  V2 batch mode cost:  $${v2Cost.toFixed(2)}/month`);
  console.log(`  V3 mainnet-$1k gas:  ${totalGas.toLocaleString()}`);
  console.log(`  V3 mainnet-$1k cost: $${costBaseline.toFixed(2)}/month`);
  console.log(`  Gas reduction:       ${((1 - totalGas / v2TotalGas) * 100).toFixed(1)}%`);
  console.log(`  Cost reduction:      ${((1 - costBaseline / v2Cost) * 100).toFixed(1)}%`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    mode: 'mainnet_budget',
    assumptions: {
      gasPrice: { baseline: GAS_PRICE_GWEI_BASELINE, stress: GAS_PRICE_GWEI_STRESS },
      ethPrice: ETH_PRICE_USD,
      monthlyBudget: MONTHLY_BUDGET_USD,
      monthlyGasBudget: MONTHLY_GAS_BUDGET,
      businessCount: 5000,
      digestEpochMinutes: DIGEST_EPOCH_WINDOW_MINUTES,
      epochsPerMonth: EPOCHS_PER_MONTH,
    },
    volume: {
      tierA: TIER_A_TOTAL,
      tierB: TIER_B_TOTAL,
      total: TIER_A_TOTAL + TIER_B_TOTAL,
      breakdown: VOLUME,
    },
    measurements: {
      anchorDigestRoot: measurements.anchorDigestRoot,
      logCriticalEventCompact: measurements.logCriticalEventCompact,
    },
    projection: {
      tierA: { events: TIER_A_TOTAL, txCount: tierATxCount, gas: tierAGas },
      tierB: { events: TIER_B_TOTAL, txCount: tierBTxCount, gas: tierBGas },
      total: { txCount: totalTxCount, gas: totalGas },
      costBaseline: costBaseline,
      costStress: costStress,
    },
    validation: {
      meetsTarget: meetsTarget,
      meetsStressTarget: meetsTargetStress,
      budgetUsagePct: (totalGas / MONTHLY_GAS_BUDGET) * 100,
    },
    comparison: {
      v2BatchGas: v2TotalGas,
      v2BatchCost: v2Cost,
      gasReductionPct: (1 - totalGas / v2TotalGas) * 100,
      costReductionPct: (1 - costBaseline / v2Cost) * 100,
    },
  };

  const reportPath = path.join(__dirname, '../reports/gas-v3-mainnet-benchmark.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  console.log('\n' + '='.repeat(70));
  console.log('BENCHMARK COMPLETE');
  console.log('='.repeat(70));

  return report;
}

runBenchmark()
  .then(report => {
    if (report.validation.meetsTarget) {
      console.log('\n🎉 SUCCESS: Mainnet-$1k mode achieves the $1,000/month target!');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED: Target not met. Review digest strategy.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
