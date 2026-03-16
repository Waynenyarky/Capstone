/**
 * V2 Gas Optimization Unit Tests (web3.js direct — no Truffle test runner)
 * Tests all V2 compact + batch contract methods for correctness.
 * Run: node blockchain/test/gas_v2_unit_tests.js
 */

const { Web3 } = require('web3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const web3 = new Web3('http://localhost:7545')
const artifactPath = (name) => path.join(__dirname, '..', 'build', 'contracts', `${name}.json`)

let passed = 0
let failed = 0

function assert(cond, msg) {
  if (!cond) { failed++; console.error(`  ❌ FAIL: ${msg}`); throw new Error(msg) }
  passed++
  console.log(`  ✅ ${msg}`)
}

async function main() {
  console.log('='.repeat(70))
  console.log('  V2 GAS OPTIMIZATION — UNIT TESTS')
  console.log('='.repeat(70))

  const AccessControlArt = JSON.parse(fs.readFileSync(artifactPath('AccessControl')))
  const AuditLogArt = JSON.parse(fs.readFileSync(artifactPath('AuditLog')))
  const DocumentStorageArt = JSON.parse(fs.readFileSync(artifactPath('DocumentStorage')))

  const accounts = await web3.eth.getAccounts()
  const deployer = accounts[0]
  const nonAuditor = accounts[2]

  // Deploy
  const ac = await new web3.eth.Contract(AccessControlArt.abi).deploy({ data: AccessControlArt.bytecode }).send({ from: deployer, gas: 3000000 })
  const al = await new web3.eth.Contract(AuditLogArt.abi).deploy({ data: AuditLogArt.bytecode, arguments: [ac.options.address] }).send({ from: deployer, gas: 5000000 })
  const ds = await new web3.eth.Contract(DocumentStorageArt.abi).deploy({ data: DocumentStorageArt.bytecode, arguments: [ac.options.address] }).send({ from: deployer, gas: 5000000 })
  console.log('Contracts deployed.\n')

  const uniqueHash = () => '0x' + crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex')
  const ZERO_HASH = '0x' + '0'.repeat(64)

  // =========================================================================
  // AuditLog: logCriticalEventCompact
  // =========================================================================
  console.log('--- logCriticalEventCompact ---')

  const h1 = uniqueHash()
  const tx1 = await al.methods.logCriticalEventCompact(h1, 3).send({ from: deployer, gas: 300000 })
  assert(tx1.status, 'should succeed with valid hash and eventCode')

  // Verify hash exists on chain
  const verify1 = await al.methods.verifyHash(h1).call()
  assert(verify1.exists === true, 'hash should be verifiable after compact log')
  assert(Number(verify1.timestamp) > 0, 'timestamp should be > 0')

  // Reject duplicate
  try {
    await al.methods.logCriticalEventCompact(h1, 3).send({ from: deployer, gas: 300000 })
    assert(false, 'should reject duplicate hash')
  } catch (e) {
    assert(true, 'duplicate hash correctly rejected')
  }

  // Reject zero hash
  try {
    await al.methods.logCriticalEventCompact(ZERO_HASH, 3).send({ from: deployer, gas: 300000 })
    assert(false, 'should reject zero hash')
  } catch (e) {
    assert(true, 'zero hash correctly rejected')
  }

  // Access control: non-auditor rejected
  try {
    await al.methods.logCriticalEventCompact(uniqueHash(), 1).send({ from: nonAuditor, gas: 300000 })
    assert(false, 'non-auditor should be rejected')
  } catch (e) {
    assert(true, 'non-auditor correctly rejected')
  }

  // Event code edge case: 0 and 255
  const h_code0 = uniqueHash()
  await al.methods.logCriticalEventCompact(h_code0, 0).send({ from: deployer, gas: 300000 })
  assert((await al.methods.verifyHash(h_code0).call()).exists, 'eventCode 0 should be accepted')

  const h_code255 = uniqueHash()
  await al.methods.logCriticalEventCompact(h_code255, 255).send({ from: deployer, gas: 300000 })
  assert((await al.methods.verifyHash(h_code255).call()).exists, 'eventCode 255 should be accepted')

  // =========================================================================
  // AuditLog: logAdminApprovalCompact
  // =========================================================================
  console.log('\n--- logAdminApprovalCompact ---')

  const h2 = uniqueHash()
  const tx2 = await al.methods.logAdminApprovalCompact(h2, 5, true).send({ from: deployer, gas: 300000 })
  assert(tx2.status, 'approval (approved=true) should succeed')
  assert((await al.methods.verifyHash(h2).call()).exists, 'approval hash should be verifiable')

  const h3 = uniqueHash()
  const tx3 = await al.methods.logAdminApprovalCompact(h3, 6, false).send({ from: deployer, gas: 300000 })
  assert(tx3.status, 'approval (approved=false) should succeed')

  // Duplicate rejection
  try {
    await al.methods.logAdminApprovalCompact(h2, 5, true).send({ from: deployer, gas: 300000 })
    assert(false, 'duplicate approval hash should be rejected')
  } catch (e) {
    assert(true, 'duplicate approval hash correctly rejected')
  }

  // =========================================================================
  // AuditLog: batchLogAuditHash
  // =========================================================================
  console.log('\n--- batchLogAuditHash ---')

  // Normal batch of 5
  const batch5 = Array.from({ length: 5 }, () => uniqueHash())
  const txB1 = await al.methods.batchLogAuditHash(batch5, 'batch_test').send({ from: deployer, gas: 2000000 })
  assert(txB1.status, 'batch of 5 hashes should succeed')
  for (const h of batch5) {
    assert((await al.methods.verifyHash(h).call()).exists, `batch hash ${h.slice(0, 10)} should exist`)
  }

  // Batch of 20 (within Ganache block gas limit)
  const batch20 = Array.from({ length: 20 }, () => uniqueHash())
  const txB2 = await al.methods.batchLogAuditHash(batch20, 'large_batch').send({ from: deployer, gas: 6000000 })
  assert(txB2.status, 'batch of 20 should succeed')
  assert((await al.methods.verifyHash(batch20[0]).call()).exists, 'first hash in batch of 20 should exist')
  assert((await al.methods.verifyHash(batch20[19]).call()).exists, 'last hash in batch of 20 should exist')

  // Batch of 51 should fail (contract rejects > 50)
  const batch51 = Array.from({ length: 51 }, () => uniqueHash())
  try {
    await al.methods.batchLogAuditHash(batch51, 'too_big').send({ from: deployer, gas: 6000000 })
    assert(false, 'batch of 51 should be rejected')
  } catch (e) {
    assert(true, 'batch > 50 correctly rejected')
  }

  // Empty batch should fail
  try {
    await al.methods.batchLogAuditHash([], 'empty').send({ from: deployer, gas: 300000 })
    assert(false, 'empty batch should be rejected')
  } catch (e) {
    assert(true, 'empty batch correctly rejected')
  }

  // Batch with duplicates/zeros: should skip them gracefully
  const existing = uniqueHash()
  await al.methods.logAuditHash(existing, 'pre_existing').send({ from: deployer, gas: 300000 })
  const newHash = uniqueHash()
  const mixedBatch = [existing, ZERO_HASH, newHash]
  const txB3 = await al.methods.batchLogAuditHash(mixedBatch, 'mixed').send({ from: deployer, gas: 2000000 })
  assert(txB3.status, 'batch with dupes/zeros should succeed')
  assert((await al.methods.verifyHash(newHash).call()).exists, 'new hash in mixed batch should exist')

  // =========================================================================
  // DocumentStorage: storeDocumentHash
  // =========================================================================
  console.log('\n--- storeDocumentHash ---')

  const uid1 = web3.utils.sha3('user-unit-1')
  const cid1 = web3.utils.sha3('QmTestCid1')
  const txD1 = await ds.methods.storeDocumentHash(uid1, 3, cid1).send({ from: deployer, gas: 300000 })
  assert(txD1.status, 'storeDocumentHash should succeed')

  // Version increment
  const cid2 = web3.utils.sha3('QmTestCid2')
  const txD2 = await ds.methods.storeDocumentHash(uid1, 3, cid2).send({ from: deployer, gas: 300000 })
  assert(txD2.status, 'second storeDocumentHash should succeed (version 2)')

  // Reject zero userIdHash
  try {
    await ds.methods.storeDocumentHash(ZERO_HASH, 3, cid1).send({ from: deployer, gas: 300000 })
    assert(false, 'zero userIdHash should be rejected')
  } catch (e) {
    assert(true, 'zero userIdHash correctly rejected')
  }

  // Reject zero cidHash
  try {
    await ds.methods.storeDocumentHash(uid1, 3, ZERO_HASH).send({ from: deployer, gas: 300000 })
    assert(false, 'zero cidHash should be rejected')
  } catch (e) {
    assert(true, 'zero cidHash correctly rejected')
  }

  // =========================================================================
  // DocumentStorage: batchStoreDocumentHash
  // =========================================================================
  console.log('\n--- batchStoreDocumentHash ---')

  const uids = [web3.utils.sha3('batch-u1'), web3.utils.sha3('batch-u2'), web3.utils.sha3('batch-u3')]
  const docTypes = [0, 1, 2]
  const cids = [web3.utils.sha3('c1'), web3.utils.sha3('c2'), web3.utils.sha3('c3')]
  const txBD = await ds.methods.batchStoreDocumentHash(uids, docTypes, cids).send({ from: deployer, gas: 2000000 })
  assert(txBD.status, 'batch of 3 document hashes should succeed')

  // Mismatched arrays
  try {
    await ds.methods.batchStoreDocumentHash([web3.utils.sha3('u1')], [0, 1], [web3.utils.sha3('c1')]).send({ from: deployer, gas: 300000 })
    assert(false, 'mismatched array lengths should be rejected')
  } catch (e) {
    assert(true, 'array mismatch correctly rejected')
  }

  // Empty batch
  try {
    await ds.methods.batchStoreDocumentHash([], [], []).send({ from: deployer, gas: 300000 })
    assert(false, 'empty batch should be rejected')
  } catch (e) {
    assert(true, 'empty document batch correctly rejected')
  }

  // =========================================================================
  // Audit entry count check
  // =========================================================================
  console.log('\n--- Entry count integrity ---')
  const hashCount = Number(await al.methods.getAuditHashCount().call())
  assert(hashCount > 0, `auditHashCount = ${hashCount} (should be > 0)`)

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n' + '='.repeat(70))
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(70))

  if (failed > 0) {
    process.exit(1)
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
