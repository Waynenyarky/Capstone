const AuditLog = artifacts.require('AuditLog')
const AccessControl = artifacts.require('AccessControl')
const DocumentStorage = artifacts.require('DocumentStorage')

contract('V2 Gas Optimization Tests', (accounts) => {
  const [owner] = accounts
  let auditLog, accessControl, documentStorage

  before(async () => {
    accessControl = await AccessControl.new({ from: owner })
    auditLog = await AuditLog.new(accessControl.address, { from: owner })
    documentStorage = await DocumentStorage.new(accessControl.address, { from: owner })
  })

  // =========================================================================
  // AuditLog V2 Tests
  // =========================================================================

  describe('AuditLog V2: logCriticalEventCompact', () => {
    it('should log a compact critical event with hash-only', async () => {
      const dataHash = web3.utils.sha3('critical-event-payload-1')
      const eventCode = 3 // business_approved

      const tx = await auditLog.logCriticalEventCompact(dataHash, eventCode, { from: owner })

      assert.equal(tx.logs.length > 0, true, 'Should emit event')
      const event = tx.logs.find(l => l.event === 'CriticalEventCompactLogged')
      assert.ok(event, 'Should emit CriticalEventCompactLogged')
      assert.equal(event.args.dataHash, dataHash)
      assert.equal(Number(event.args.eventCode), eventCode)
    })

    it('should reject duplicate hash', async () => {
      const dataHash = web3.utils.sha3('critical-event-payload-1')
      try {
        await auditLog.logCriticalEventCompact(dataHash, 3, { from: owner })
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('Hash already exists'))
      }
    })

    it('should reject zero hash', async () => {
      try {
        await auditLog.logCriticalEventCompact('0x' + '0'.repeat(64), 3, { from: owner })
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('Hash cannot be zero'))
      }
    })

    it('should be verifiable via verifyHash', async () => {
      const dataHash = web3.utils.sha3('critical-compact-verify-test')
      await auditLog.logCriticalEventCompact(dataHash, 1, { from: owner })
      const result = await auditLog.verifyHash(dataHash)
      assert.equal(result.exists, true)
      assert.ok(Number(result.timestamp) > 0)
    })
  })

  describe('AuditLog V2: logAdminApprovalCompact', () => {
    it('should log a compact admin approval with hash-only', async () => {
      const dataHash = web3.utils.sha3('approval-payload-1')
      const eventCode = 5 // application_approved
      const approved = true

      const tx = await auditLog.logAdminApprovalCompact(dataHash, eventCode, approved, { from: owner })

      const event = tx.logs.find(l => l.event === 'AdminApprovalCompactLogged')
      assert.ok(event, 'Should emit AdminApprovalCompactLogged')
      assert.equal(event.args.dataHash, dataHash)
      assert.equal(Number(event.args.eventCode), eventCode)
      assert.equal(event.args.approved, true)
    })

    it('should log rejection correctly', async () => {
      const dataHash = web3.utils.sha3('approval-payload-rejection')
      const tx = await auditLog.logAdminApprovalCompact(dataHash, 6, false, { from: owner })
      const event = tx.logs.find(l => l.event === 'AdminApprovalCompactLogged')
      assert.equal(event.args.approved, false)
    })
  })

  describe('AuditLog V2: batchLogAuditHash', () => {
    it('should log multiple hashes in a single transaction', async () => {
      const hashes = []
      for (let i = 0; i < 5; i++) {
        hashes.push(web3.utils.sha3(`batch-hash-${i}-${Date.now()}`))
      }

      const tx = await auditLog.batchLogAuditHash(hashes, 'batch', { from: owner })

      const batchEvent = tx.logs.find(l => l.event === 'BatchAuditHashLogged')
      assert.ok(batchEvent, 'Should emit BatchAuditHashLogged')
      assert.equal(Number(batchEvent.args.count), 5)

      // Verify each hash is stored
      for (const h of hashes) {
        const result = await auditLog.verifyHash(h)
        assert.equal(result.exists, true, `Hash ${h.slice(0, 10)} should exist`)
      }
    })

    it('should skip duplicate and zero hashes gracefully', async () => {
      const existingHash = web3.utils.sha3('batch-existing-hash')
      await auditLog.logAuditHash(existingHash, 'test', { from: owner })

      const newHash = web3.utils.sha3(`batch-new-hash-${Date.now()}`)
      const hashes = [existingHash, '0x' + '0'.repeat(64), newHash]

      const tx = await auditLog.batchLogAuditHash(hashes, 'batch', { from: owner })
      assert.ok(tx.receipt.status, 'Transaction should succeed')

      const result = await auditLog.verifyHash(newHash)
      assert.equal(result.exists, true)
    })

    it('should reject empty batch', async () => {
      try {
        await auditLog.batchLogAuditHash([], 'batch', { from: owner })
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('Empty batch'))
      }
    })

    it('should reject batch > 50', async () => {
      const hashes = []
      for (let i = 0; i < 51; i++) {
        hashes.push(web3.utils.sha3(`too-many-${i}`))
      }
      try {
        await auditLog.batchLogAuditHash(hashes, 'batch', { from: owner })
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('Batch too large'))
      }
    })
  })

  // =========================================================================
  // DocumentStorage V2 Tests
  // =========================================================================

  describe('DocumentStorage V2: storeDocumentHash', () => {
    it('should store a document hash', async () => {
      const userIdHash = web3.utils.sha3('user-123')
      const cidHash = web3.utils.sha3('QmTestCid123')
      const docType = 3 // BUSINESS_REGISTRATION

      const tx = await documentStorage.storeDocumentHash(userIdHash, docType, cidHash, { from: owner })

      const event = tx.logs.find(l => l.event === 'DocumentHashStored')
      assert.ok(event, 'Should emit DocumentHashStored')
      assert.equal(event.args.userIdHash, userIdHash)
      assert.equal(Number(event.args.version), 1)
    })

    it('should increment version on re-store', async () => {
      const userIdHash = web3.utils.sha3('user-123')
      const cidHash2 = web3.utils.sha3('QmTestCid456')
      const docType = 3

      const tx = await documentStorage.storeDocumentHash(userIdHash, docType, cidHash2, { from: owner })
      const event = tx.logs.find(l => l.event === 'DocumentHashStored')
      assert.equal(Number(event.args.version), 2)
    })

    it('should reject zero userIdHash', async () => {
      try {
        await documentStorage.storeDocumentHash('0x' + '0'.repeat(64), 3, web3.utils.sha3('cid'), { from: owner })
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('userIdHash cannot be zero'))
      }
    })
  })

  describe('DocumentStorage V2: batchStoreDocumentHash', () => {
    it('should store multiple document hashes in one tx', async () => {
      const userIdHashes = [web3.utils.sha3('batch-user-1'), web3.utils.sha3('batch-user-2')]
      const docTypes = [0, 1] // AVATAR, ID_FRONT
      const cidHashes = [web3.utils.sha3('cid-a'), web3.utils.sha3('cid-b')]

      const tx = await documentStorage.batchStoreDocumentHash(userIdHashes, docTypes, cidHashes, { from: owner })

      const batchEvent = tx.logs.find(l => l.event === 'BatchDocumentHashStored')
      assert.ok(batchEvent, 'Should emit BatchDocumentHashStored')
      assert.equal(Number(batchEvent.args.count), 2)
    })

    it('should reject mismatched array lengths', async () => {
      try {
        await documentStorage.batchStoreDocumentHash(
          [web3.utils.sha3('u1')],
          [0, 1],
          [web3.utils.sha3('c1')],
          { from: owner }
        )
        assert.fail('Should have reverted')
      } catch (err) {
        assert.ok(err.message.includes('Array length mismatch'))
      }
    })
  })

  // =========================================================================
  // Gas Comparison: V1 vs V2
  // =========================================================================

  describe('Gas Comparison: V1 vs V2', () => {
    const results = []

    it('V1 logCriticalEvent gas', async () => {
      const tx = await auditLog.logCriticalEvent('permit_issued', 'user-gas-test-1', '{"action":"approve","details":"full JSON payload with lots of text data for testing gas costs"}', { from: owner })
      results.push({ method: 'logCriticalEvent (V1)', gas: tx.receipt.gasUsed })
    })

    it('V2 logCriticalEventCompact gas', async () => {
      const dataHash = web3.utils.sha3('compact-critical-gas-test')
      const tx = await auditLog.logCriticalEventCompact(dataHash, 1, { from: owner })
      results.push({ method: 'logCriticalEventCompact (V2)', gas: tx.receipt.gasUsed })
    })

    it('V1 logAdminApproval gas', async () => {
      const tx = await auditLog.logAdminApproval('appr-gas-1', 'application_approved', 'user-gas-1', 'admin-gas-1', true, '{"reason":"All documents verified, compliance check passed"}', { from: owner })
      results.push({ method: 'logAdminApproval (V1)', gas: tx.receipt.gasUsed })
    })

    it('V2 logAdminApprovalCompact gas', async () => {
      const dataHash = web3.utils.sha3('compact-approval-gas-test')
      const tx = await auditLog.logAdminApprovalCompact(dataHash, 5, true, { from: owner })
      results.push({ method: 'logAdminApprovalCompact (V2)', gas: tx.receipt.gasUsed })
    })

    it('V1 logAuditHash (single) gas', async () => {
      const hash = web3.utils.sha3('single-audit-hash-gas-test')
      const tx = await auditLog.logAuditHash(hash, 'profile_update', { from: owner })
      results.push({ method: 'logAuditHash single (V1)', gas: tx.receipt.gasUsed })
    })

    it('V2 batchLogAuditHash (10 hashes) gas', async () => {
      const hashes = []
      for (let i = 0; i < 10; i++) {
        hashes.push(web3.utils.sha3(`batch-gas-test-${i}-${Date.now()}`))
      }
      const tx = await auditLog.batchLogAuditHash(hashes, 'batch', { from: owner })
      results.push({ method: 'batchLogAuditHash x10 (V2)', gas: tx.receipt.gasUsed, perItem: Math.round(tx.receipt.gasUsed / 10) })
    })

    it('V1 storeDocument gas', async () => {
      const tx = await documentStorage.storeDocument('gas-test-user-1', 3, 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', { from: owner })
      results.push({ method: 'storeDocument (V1)', gas: tx.receipt.gasUsed })
    })

    it('V2 storeDocumentHash gas', async () => {
      const userIdHash = web3.utils.sha3('gas-test-user-2')
      const cidHash = web3.utils.sha3('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
      const tx = await documentStorage.storeDocumentHash(userIdHash, 3, cidHash, { from: owner })
      results.push({ method: 'storeDocumentHash (V2)', gas: tx.receipt.gasUsed })
    })

    after(() => {
      console.log('\n' + '='.repeat(70))
      console.log('  GAS COMPARISON: V1 (Legacy) vs V2 (Optimized)')
      console.log('='.repeat(70))
      console.log(String('Method').padEnd(40) + String('Gas Used').padStart(12) + String('Per Item').padStart(12))
      console.log('-'.repeat(70))
      for (const r of results) {
        const perItem = r.perItem ? String(r.perItem) : '-'
        console.log(String(r.method).padEnd(40) + String(r.gas).padStart(12) + String(perItem).padStart(12))
      }
      console.log('='.repeat(70))

      // Compute savings
      const v1Critical = results.find(r => r.method.includes('logCriticalEvent (V1)'))
      const v2Critical = results.find(r => r.method.includes('logCriticalEventCompact (V2)'))
      const v1Approval = results.find(r => r.method.includes('logAdminApproval (V1)'))
      const v2Approval = results.find(r => r.method.includes('logAdminApprovalCompact (V2)'))
      const v1Store = results.find(r => r.method.includes('storeDocument (V1)'))
      const v2Store = results.find(r => r.method.includes('storeDocumentHash (V2)'))
      const v1Single = results.find(r => r.method.includes('logAuditHash single (V1)'))
      const v2Batch = results.find(r => r.method.includes('batchLogAuditHash x10 (V2)'))

      console.log('\n  SAVINGS SUMMARY:')
      if (v1Critical && v2Critical) {
        const pct = ((1 - v2Critical.gas / v1Critical.gas) * 100).toFixed(1)
        console.log(`  logCriticalEvent: ${v1Critical.gas} → ${v2Critical.gas} (${pct}% reduction)`)
      }
      if (v1Approval && v2Approval) {
        const pct = ((1 - v2Approval.gas / v1Approval.gas) * 100).toFixed(1)
        console.log(`  logAdminApproval: ${v1Approval.gas} → ${v2Approval.gas} (${pct}% reduction)`)
      }
      if (v1Store && v2Store) {
        const pct = ((1 - v2Store.gas / v1Store.gas) * 100).toFixed(1)
        console.log(`  storeDocument:    ${v1Store.gas} → ${v2Store.gas} (${pct}% reduction)`)
      }
      if (v1Single && v2Batch) {
        const pct = ((1 - v2Batch.perItem / v1Single.gas) * 100).toFixed(1)
        console.log(`  logAuditHash:     ${v1Single.gas}/each → ${v2Batch.perItem}/each in batch (${pct}% reduction)`)
      }
      console.log('='.repeat(70) + '\n')
    })
  })
})
