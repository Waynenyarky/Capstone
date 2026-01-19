/**
 * Integration Tests: IPFS → Blockchain Flow
 * 
 * Tests the complete flow:
 * 1. Upload file to IPFS
 * 2. Store IPFS CID in DocumentStorage contract
 * 3. Verify CID on blockchain
 * 4. Retrieve file from IPFS using CID
 */

const { expect } = require('chai');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import services
const ipfsService = require('../../services/business-service/src/lib/ipfsService');
const documentStorageService = require('../../services/audit-service/src/lib/documentStorageService');
const blockchainService = require('../../services/audit-service/src/lib/blockchainService');

describe('IPFS → Blockchain Integration', function () {
  this.timeout(30000); // Increase timeout for blockchain operations

  let testFileBuffer;
  let testFileName;
  let uploadedCid;
  let testUserId;

  before(async function () {
    // Initialize services
    await blockchainService.initialize();
    await documentStorageService.initialize();

    // Check if services are available
    if (!ipfsService.isAvailable()) {
      this.skip('IPFS service not available');
    }

    if (!blockchainService.isAvailable()) {
      this.skip('Blockchain service not available');
    }

    // Create test file
    testFileBuffer = Buffer.from('Test file content for IPFS integration test');
    testFileName = `test-${Date.now()}.txt`;
    testUserId = `test-user-${Date.now()}`;
  });

  after(async function () {
    // Cleanup
    await blockchainService.cleanup();
  });

  describe('File Upload to IPFS', function () {
    it('should upload file to IPFS and return CID', async function () {
      const result = await ipfsService.uploadFile(testFileBuffer, testFileName);

      expect(result).to.have.property('cid');
      expect(result).to.have.property('size');
      expect(result.cid).to.be.a('string');
      expect(result.cid.length).to.be.greaterThan(0);

      uploadedCid = result.cid;
    });

    it('should pin file to IPFS', async function () {
      expect(uploadedCid).to.exist;
      await ipfsService.pinFile(uploadedCid);
      // If no error, pinning succeeded
    });

    it('should retrieve file from IPFS using CID', async function () {
      expect(uploadedCid).to.exist;
      const retrievedBuffer = await ipfsService.getFile(uploadedCid);

      expect(retrievedBuffer).to.be.instanceOf(Buffer);
      expect(retrievedBuffer.toString()).to.equal(testFileBuffer.toString());
    });
  });

  describe('Store CID in DocumentStorage Contract', function () {
    it('should store document CID in blockchain', async function () {
      expect(uploadedCid).to.exist;

      const result = await documentStorageService.storeDocument(
        testUserId,
        'OTHER',
        uploadedCid
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
      expect(result.txHash).to.be.a('string');
    });

    it('should retrieve document CID from blockchain', async function () {
      const result = await documentStorageService.getDocumentCid(testUserId, 'OTHER');

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('ipfsCid');
      expect(result.ipfsCid).to.equal(uploadedCid);
      expect(result).to.have.property('version');
      expect(result.version).to.equal(1);
    });

    it('should check if document exists', async function () {
      const exists = await documentStorageService.documentExists(testUserId, 'OTHER');
      expect(exists).to.be.true;
    });
  });

  describe('Document Version History', function () {
    let secondCid;

    it('should store new version of document', async function () {
      // Upload new version
      const newContent = Buffer.from('Updated test file content');
      const uploadResult = await ipfsService.uploadFile(newContent, `test-v2-${Date.now()}.txt`);
      secondCid = uploadResult.cid;

      const result = await documentStorageService.storeDocument(
        testUserId,
        'OTHER',
        secondCid
      );

      expect(result.success).to.be.true;
    });

    it('should retrieve latest version', async function () {
      const result = await documentStorageService.getDocumentCid(testUserId, 'OTHER');

      expect(result.success).to.be.true;
      expect(result.ipfsCid).to.equal(secondCid);
      expect(result.version).to.equal(2);
    });

    it('should retrieve document history', async function () {
      const history = await documentStorageService.getDocumentHistory(testUserId, 'OTHER');

      expect(history).to.have.property('success');
      expect(history.success).to.be.true;
      expect(history).to.have.property('cids');
      expect(history.cids).to.be.an('array');
      expect(history.cids.length).to.equal(2);
      expect(history.cids).to.include(uploadedCid);
      expect(history.cids).to.include(secondCid);
      expect(history).to.have.property('versions');
      expect(history.versions).to.deep.equal([1, 2]);
    });
  });

  describe('End-to-End Flow', function () {
    it('should complete full flow: upload → store → verify → retrieve', async function () {
      const testContent = Buffer.from('E2E test content');
      const fileName = `e2e-test-${Date.now()}.txt`;
      const userId = `e2e-user-${Date.now()}`;

      // 1. Upload to IPFS
      const uploadResult = await ipfsService.uploadFile(testContent, fileName);
      expect(uploadResult.cid).to.exist;

      // 2. Pin file
      await ipfsService.pinFile(uploadResult.cid);

      // 3. Store CID in blockchain
      const storeResult = await documentStorageService.storeDocument(
        userId,
        'OTHER',
        uploadResult.cid
      );
      expect(storeResult.success).to.be.true;

      // 4. Verify CID on blockchain
      const verifyResult = await documentStorageService.getDocumentCid(userId, 'OTHER');
      expect(verifyResult.success).to.be.true;
      expect(verifyResult.ipfsCid).to.equal(uploadResult.cid);

      // 5. Retrieve file from IPFS
      const retrievedBuffer = await ipfsService.getFile(uploadResult.cid);
      expect(retrievedBuffer.toString()).to.equal(testContent.toString());

      // 6. Verify content matches
      expect(retrievedBuffer.toString()).to.equal(testContent.toString());
    });
  });
});
