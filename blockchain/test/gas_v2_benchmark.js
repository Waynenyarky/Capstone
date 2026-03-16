/**
 * V2 Gas Optimization Benchmark
 * Deploys fresh contracts, measures V1 vs V2 gas, and validates $1,000/month target.
 * Uses web3.js directly against Ganache (same pattern as actual_gas_test_web3.js).
 */

const { Web3 } = require('web3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const web3 = new Web3('http://localhost:7545')

const artifactPath = (name) => path.join(__dirname, '..', 'build', 'contracts', `${name}.json`)

async function main() {
  console.log('='.repeat(70))
  console.log('  V2 GAS OPTIMIZATION BENCHMARK')
  console.log('  Target: <= $1,000/month mainnet-equivalent (5,000-business LGU)')
  console.log('='.repeat(70))

  const AccessControlArt = JSON.parse(fs.readFileSync(artifactPath('AccessControl')))
  const AuditLogArt = JSON.parse(fs.readFileSync(artifactPath('AuditLog')))
  const DocumentStorageArt = JSON.parse(fs.readFileSync(artifactPath('DocumentStorage')))

  const accounts = await web3.eth.getAccounts()
  const deployer = accounts[0]

  // ---- Deploy contracts ----
  console.log('\n--- Deploying contracts ---')
  const AccessControl = new web3.eth.Contract(AccessControlArt.abi)
  const ac = await AccessControl.deploy({ data: AccessControlArt.bytecode }).send({ from: deployer, gas: 3000000 })

  const AuditLog = new web3.eth.Contract(AuditLogArt.abi)
  const al = await AuditLog.deploy({ data: AuditLogArt.bytecode, arguments: [ac.options.address] }).send({ from: deployer, gas: 5000000 })

  const DocumentStorage = new web3.eth.Contract(DocumentStorageArt.abi)
  const ds = await DocumentStorage.deploy({ data: DocumentStorageArt.bytecode, arguments: [ac.options.address] }).send({ from: deployer, gas: 5000000 })

  // Grant roles to deployer
  const DOCUMENT_MANAGER_ROLE = await ac.methods.DOCUMENT_MANAGER_ROLE().call()
  await ac.methods.grantRole(accounts[1], DOCUMENT_MANAGER_ROLE).send({ from: deployer, gas: 200000 })

  console.log('Contracts deployed and roles granted.\n')

  // ---- Helper ----
  async function measureGas(label, txPromise) {
    const tx = await txPromise
    const gas = typeof tx.gasUsed !== 'undefined' ? Number(tx.gasUsed) : Number(tx.receipt?.gasUsed || 0)
    return { label, gas }
  }

  const results = []
  const uniqueSuffix = () => crypto.randomBytes(8).toString('hex')

  // =========================================================================
  // V1 Measurements
  // =========================================================================
  console.log('--- V1 (Legacy) Measurements ---')

  // logAuditHash V1
  const hash1 = '0x' + crypto.createHash('sha256').update('v1-audit-' + uniqueSuffix()).digest('hex')
  results.push(await measureGas('logAuditHash (V1)', al.methods.logAuditHash(hash1, 'profile_update').send({ from: deployer, gas: 300000 })))

  // logCriticalEvent V1
  results.push(await measureGas('logCriticalEvent (V1)', al.methods.logCriticalEvent('permit_issued', 'user-v1-test', '{"action":"approve","reason":"All docs verified","inspector":"John","notes":"Compliance check passed successfully"}').send({ from: deployer, gas: 500000 })))

  // logAdminApproval V1
  results.push(await measureGas('logAdminApproval (V1)', al.methods.logAdminApproval('appr-v1-1', 'application_approved', 'user-v1-1', 'admin-v1-1', true, '{"reason":"Documents complete","checklist":["fire","sanitary","zoning"]}').send({ from: deployer, gas: 500000 })))

  // storeDocument V1
  results.push(await measureGas('storeDocument (V1)', ds.methods.storeDocument('user-v1-doc', 3, 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG').send({ from: deployer, gas: 500000 })))

  // =========================================================================
  // V2 Measurements
  // =========================================================================
  console.log('--- V2 (Optimized) Measurements ---')

  // logAuditHash V2 (same method, no change needed for hash-only)
  const hash2 = '0x' + crypto.createHash('sha256').update('v2-audit-' + uniqueSuffix()).digest('hex')
  results.push(await measureGas('logAuditHash (V2, same)', al.methods.logAuditHash(hash2, 'audit').send({ from: deployer, gas: 300000 })))

  // logCriticalEventCompact V2
  const critHash = '0x' + crypto.createHash('sha256').update('v2-critical-' + uniqueSuffix()).digest('hex')
  results.push(await measureGas('logCriticalEventCompact (V2)', al.methods.logCriticalEventCompact(critHash, 1).send({ from: deployer, gas: 300000 })))

  // logAdminApprovalCompact V2
  const apprHash = '0x' + crypto.createHash('sha256').update('v2-approval-' + uniqueSuffix()).digest('hex')
  results.push(await measureGas('logAdminApprovalCompact (V2)', al.methods.logAdminApprovalCompact(apprHash, 5, true).send({ from: deployer, gas: 300000 })))

  // storeDocumentHash V2
  const userIdHash = web3.utils.sha3('user-v2-doc')
  const cidHash = web3.utils.sha3('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
  results.push(await measureGas('storeDocumentHash (V2)', ds.methods.storeDocumentHash(userIdHash, 3, cidHash).send({ from: deployer, gas: 300000 })))

  // batchLogAuditHash V2 (10 hashes)
  const batchHashes = []
  for (let i = 0; i < 10; i++) {
    batchHashes.push('0x' + crypto.createHash('sha256').update('batch-' + i + '-' + uniqueSuffix()).digest('hex'))
  }
  const batchResult = await measureGas('batchLogAuditHash x10 (V2)', al.methods.batchLogAuditHash(batchHashes, 'batch').send({ from: deployer, gas: 2000000 }))
  batchResult.perItem = Math.round(batchResult.gas / 10)
  results.push(batchResult)

  // =========================================================================
  // Results Table
  // =========================================================================
  console.log('\n' + '='.repeat(70))
  console.log('  GAS COMPARISON: V1 (Legacy) vs V2 (Optimized)')
  console.log('='.repeat(70))
  console.log(String('Method').padEnd(42) + String('Gas Used').padStart(12) + String('Per Item').padStart(12))
  console.log('-'.repeat(70))
  for (const r of results) {
    const perItem = r.perItem ? String(r.perItem) : '-'
    console.log(String(r.label).padEnd(42) + String(r.gas).padStart(12) + String(perItem).padStart(12))
  }
  console.log('='.repeat(70))

  // =========================================================================
  // Savings Analysis
  // =========================================================================
  const find = (substr) => results.find(r => r.label.includes(substr))
  const v1Critical = find('logCriticalEvent (V1)')
  const v2Critical = find('logCriticalEventCompact (V2)')
  const v1Approval = find('logAdminApproval (V1)')
  const v2Approval = find('logAdminApprovalCompact (V2)')
  const v1Store = find('storeDocument (V1)')
  const v2Store = find('storeDocumentHash (V2)')
  const v1Audit = find('logAuditHash (V1)')
  const v2Batch = find('batchLogAuditHash x10 (V2)')

  console.log('\n  PER-OPERATION SAVINGS:')
  const savings = []
  if (v1Critical && v2Critical) {
    const pct = ((1 - v2Critical.gas / v1Critical.gas) * 100).toFixed(1)
    console.log(`  logCriticalEvent:  ${v1Critical.gas} → ${v2Critical.gas}  (${pct}% reduction)`)
    savings.push({ op: 'logCriticalEvent', v1: v1Critical.gas, v2: v2Critical.gas, pct: parseFloat(pct) })
  }
  if (v1Approval && v2Approval) {
    const pct = ((1 - v2Approval.gas / v1Approval.gas) * 100).toFixed(1)
    console.log(`  logAdminApproval:  ${v1Approval.gas} → ${v2Approval.gas}  (${pct}% reduction)`)
    savings.push({ op: 'logAdminApproval', v1: v1Approval.gas, v2: v2Approval.gas, pct: parseFloat(pct) })
  }
  if (v1Store && v2Store) {
    const pct = ((1 - v2Store.gas / v1Store.gas) * 100).toFixed(1)
    console.log(`  storeDocument:     ${v1Store.gas} → ${v2Store.gas}  (${pct}% reduction)`)
    savings.push({ op: 'storeDocument', v1: v1Store.gas, v2: v2Store.gas, pct: parseFloat(pct) })
  }
  if (v1Audit && v2Batch) {
    const pct = ((1 - v2Batch.perItem / v1Audit.gas) * 100).toFixed(1)
    console.log(`  logAuditHash:      ${v1Audit.gas}/each → ${v2Batch.perItem}/each in batch  (${pct}% reduction)`)
    savings.push({ op: 'logAuditHash (batch)', v1: v1Audit.gas, v2: v2Batch.perItem, pct: parseFloat(pct) })
  }

  // =========================================================================
  // Monthly Cost Projection (using report volume assumptions)
  // =========================================================================
  // From report Section 4.1: 5,000-business city monthly volumes
  const volumes = {
    logAuditHash: 650,
    logCriticalEvent: 30,
    logAdminApproval: 200,
    registerUser: 50,        // unchanged
    updateProfileHash: 100,  // unchanged
    storeDocument: 400,
  }

  // V1 gas per operation (from report measured averages)
  const v1Gas = {
    logAuditHash: 178586,
    logCriticalEvent: v1Critical ? v1Critical.gas : 242877,
    logAdminApproval: v1Approval ? v1Approval.gas : 316235,
    registerUser: 213419,
    updateProfileHash: 44265,
    storeDocument: v1Store ? v1Store.gas : 208034,
  }

  // =========================================================================
  // V2 Monthly Projection: Full Pipeline (Tiers + Compact + Batching)
  // =========================================================================
  //
  // The key insight: gas reduction comes from THREE combined levers:
  //   1. TIER POLICY: Tier C events are fully eliminated (0 gas)
  //   2. DIGEST BATCHING: Tier B events become 1 digest tx per flush interval
  //   3. COMPACT METHODS: Tier A events use hash-only V2 methods
  //
  // logAuditHash breakdown by tier (from gasPolicy.js rules):
  //   Tier A (legally significant): permit_issued, business_approved/rejected,
  //          application_approved/rejected, role_change, admin_action, etc.
  //          ~25% of logAuditHash volume = 163 events/month → 163 individual txs
  //   Tier B (routine, batched): profile_update, email_change, password_change,
  //          login, logout, session, mfa, document_uploaded, status_change
  //          ~55% of logAuditHash volume = 358 events/month → digest batches
  //          At 10 hashes/batch, ~36 batch txs/month
  //   Tier C (off-chain only): page_view, search, notification_sent/read, export
  //          ~20% of logAuditHash volume = 130 events/month → 0 gas
  //
  // logCriticalEvent: always Tier A, but uses compact V2 method
  // logAdminApproval: always Tier A, but uses compact V2 method
  // storeDocument: uses V2 storeDocumentHash (hash-only)
  // registerUser, updateProfileHash: unchanged (already efficient)

  const tierA_auditPct = 0.25
  const tierB_auditPct = 0.55
  const tierC_auditPct = 0.20
  const batchSize = 10

  const tierA_auditVolume = Math.round(volumes.logAuditHash * tierA_auditPct)
  const tierB_auditVolume = Math.round(volumes.logAuditHash * tierB_auditPct)
  const tierC_auditVolume = Math.round(volumes.logAuditHash * tierC_auditPct)
  const tierB_batchTxCount = Math.ceil(tierB_auditVolume / batchSize)

  const v2Measured = {
    logAuditHash_single: v1Audit ? v1Audit.gas : 178586,
    logAuditHash_batchTx: v2Batch ? v2Batch.gas : 1413833,
    logCriticalEventCompact: v2Critical ? v2Critical.gas : 171378,
    logAdminApprovalCompact: v2Approval ? v2Approval.gas : 171916,
    storeDocumentHash: v2Store ? v2Store.gas : 169457,
    registerUser: 213419,
    updateProfileHash: 44265,
  }

  const v1TotalGas =
    volumes.logAuditHash * v1Gas.logAuditHash +
    volumes.logCriticalEvent * v1Gas.logCriticalEvent +
    volumes.logAdminApproval * v1Gas.logAdminApproval +
    volumes.registerUser * v1Gas.registerUser +
    volumes.updateProfileHash * v1Gas.updateProfileHash +
    volumes.storeDocument * v1Gas.storeDocument

  const v2TotalGas =
    tierA_auditVolume * v2Measured.logAuditHash_single +       // Tier A: individual txs
    tierB_batchTxCount * v2Measured.logAuditHash_batchTx +     // Tier B: batched digests
    0 +                                                         // Tier C: eliminated
    volumes.logCriticalEvent * v2Measured.logCriticalEventCompact +
    volumes.logAdminApproval * v2Measured.logAdminApprovalCompact +
    volumes.registerUser * v2Measured.registerUser +
    volumes.updateProfileHash * v2Measured.updateProfileHash +
    volumes.storeDocument * v2Measured.storeDocumentHash

  console.log('\n  Volume breakdown:')
  console.log(`    logAuditHash Tier A: ${tierA_auditVolume} individual txs`)
  console.log(`    logAuditHash Tier B: ${tierB_auditVolume} events → ${tierB_batchTxCount} batch txs`)
  console.log(`    logAuditHash Tier C: ${tierC_auditVolume} events → 0 txs (skipped)`)
  console.log(`    logCriticalEvent:    ${volumes.logCriticalEvent} compact txs`)
  console.log(`    logAdminApproval:    ${volumes.logAdminApproval} compact txs`)
  console.log(`    storeDocument:       ${volumes.storeDocument} hash-only txs`)
  console.log(`    registerUser:        ${volumes.registerUser} txs (unchanged)`)
  console.log(`    updateProfileHash:   ${volumes.updateProfileHash} txs (unchanged)`)

  const reductionPct = ((1 - v2TotalGas / v1TotalGas) * 100).toFixed(1)

  // Cost at Ethereum mainnet (20 gwei, $2000/ETH)
  const gasPrice = 20 // gwei
  const ethPrice = 2000 // USD
  const v1CostUsd = (v1TotalGas * gasPrice * 1e-9 * ethPrice)
  const v2CostUsd = (v2TotalGas * gasPrice * 1e-9 * ethPrice)

  console.log('\n' + '='.repeat(70))
  console.log('  MONTHLY COST PROJECTION (5,000-business LGU)')
  console.log('='.repeat(70))
  console.log(`  V1 total monthly gas:   ${v1TotalGas.toLocaleString()}`)
  console.log(`  V2 total monthly gas:   ${v2TotalGas.toLocaleString()}`)
  console.log(`  Gas reduction:          ${reductionPct}%`)
  console.log('')
  console.log(`  V1 Ethereum mainnet:    $${v1CostUsd.toFixed(2)}/month`)
  console.log(`  V2 Ethereum mainnet:    $${v2CostUsd.toFixed(2)}/month`)
  console.log(`  V2 Polygon PoS:         $${(v2TotalGas * 30e-9 * 0.5).toFixed(2)}/month`)
  console.log(`  V2 Arbitrum One:        $${(v2TotalGas * 0.1e-9 * 2000).toFixed(2)}/month`)
  console.log(`  V2 Optimism:            $${(v2TotalGas * 0.001e-9 * 2000).toFixed(2)}/month`)

  // =========================================================================
  // Gate Check: $1,000/month target
  // =========================================================================
  const TARGET = 1000
  const passed = v2CostUsd <= TARGET

  console.log('\n' + '='.repeat(70))
  console.log(`  ACCEPTANCE GATE: <= $${TARGET}/month on Ethereum mainnet`)
  console.log('='.repeat(70))
  console.log(`  V2 monthly cost:  $${v2CostUsd.toFixed(2)}`)
  console.log(`  Target:           $${TARGET.toFixed(2)}`)
  console.log(`  Result:           ${passed ? '✅ PASSED' : '❌ FAILED'}`)
  if (!passed) {
    const needed = ((1 - TARGET / v1CostUsd) * 100).toFixed(1)
    console.log(`  (Need ${needed}% total reduction to meet target; achieved ${reductionPct}%)`)
  }
  console.log('='.repeat(70) + '\n')

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    measurements: results.map(r => ({ label: r.label, gas: r.gas, perItem: r.perItem || null })),
    savings,
    monthlyProjection: {
      v1TotalGas, v2TotalGas, reductionPct: parseFloat(reductionPct),
      v1CostUsd: parseFloat(v1CostUsd.toFixed(2)),
      v2CostUsd: parseFloat(v2CostUsd.toFixed(2)),
      targetUsd: TARGET,
      targetMet: passed,
    },
    volumes,
    tierPolicy: {
      tierA_pct: 45, tierB_pct: 40, tierC_pct: 15,
      batchSize: 10,
    },
  }

  const reportPath = path.join(__dirname, '..', 'reports', 'gas-v2-benchmark.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report written to: ${reportPath}`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
