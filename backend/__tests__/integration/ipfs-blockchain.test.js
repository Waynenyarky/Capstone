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

// Setup blockchain mocks for testing without Docker infrastructure
const { setupBlockchainMocks, resetBlockchainMocks } = require('../helpers/blockchain-mocks');

// Apply mocks before importing services
setupBlockchainMocks();

// Import services (now mocked)
const ipfsService = require('../../services/business-service/src/lib/ipfsService');
const documentStorageService = require('../../services/audit-service/src/lib/documentStorageService');
const blockchainService = require('../../services/audit-service/src/lib/blockchainService');

describe('IPFS → Blockchain Integration', function () {
  jest.setTimeout(30000); // Increase timeout for blockchain operations

  let testFileBuffer;
  let testFileName;
  let uploadedCid;
  let testUserId;

  beforeAll(async function () {
    // Reset mocks for clean test state
    resetBlockchainMocks();

    // Initialize mock services
    await blockchainService.initialize();
    await documentStorageService.initialize();

    // Create test file
    testFileBuffer = Buffer.from('Test file content for IPFS integration test');
    testFileName = `test-${Date.now()}.txt`;
    testUserId = `test-user-${Date.now()}`;
  });

  describe('File Upload to IPFS', function () {
    it('should upload file to IPFS and return CID', async function () {
      const result = await ipfsService.uploadFile(testFileBuffer, testFileName);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('cid');
      expect(result).to.have.property('size');
      expect(result.cid).to.be.a('string');
      expect(result.cid.length).to.be.greaterThan(0);

      uploadedCid = result.cid;
    });

    it('should pin file to IPFS', async function () {
      const result = await ipfsService.pinFile(uploadedCid);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
    });

    it('should retrieve file from IPFS using CID', async function () {
      const result = await ipfsService.getFile(uploadedCid);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('content');
      expect(result).to.have.property('filename');
      expect(result.filename).to.equal(testFileName);
      expect(Buffer.compare(result.content, testFileBuffer)).to.equal(0);
    });
  });

  describe('Document Storage on Blockchain', function () {
    it('should store document CID in blockchain', async function () {
      const result = await documentStorageService.storeDocument(
        uploadedCid,
        testUserId,
        'test_document'
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
      expect(result).to.have.property('docId');
    });

    it('should retrieve document CID from blockchain', async function () {
      const result = await documentStorageService.getDocument(uploadedCid);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('cid');
      expect(result.cid).to.equal(uploadedCid);
      expect(result).to.have.property('userId');
      expect(result.userId).to.equal(testUserId);
    });

    it('should check if document exists', async function () {
      const result = await documentStorageService.getDocument(uploadedCid);
      expect(result.success).to.be.true;
    });
  });

  describe('Document Versioning', function () {
    it('should store new version of document', async function () {
      const newContent = new Buffer('Updated test file content');
      const newFileName = `test-updated-${Date.now()}.txt`;

      const uploadResult = await ipfsService.uploadFile(newContent, newFileName);
      expect(uploadResult.success).to.be.true;

      const storeResult = await documentStorageService.storeDocument(
        uploadResult.cid,
        testUserId,
        'test_document'
      );
      expect(storeResult.success).to.be.true;
    });

    it('should retrieve latest version', async function () {
      const userDocs = await documentStorageService.getDocumentsByUser(testUserId);
      expect(userDocs.success).to.be.true;
      expect(userDocs.documents.length).to.be.greaterThan(0);
    });
  });

  describe('Audit Trail', function () {
    it('should log audit events to blockchain', async function () {
      const result = await blockchainService.logAuditHash(
        crypto.createHash('sha256').update('test audit data').digest('hex'),
        'test_event'
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
      expect(result).to.have.property('blockNumber');
    });

    it('should log critical events', async function () {
      const result = await blockchainService.logCriticalEvent(
        'test_critical_event',
        { details: 'test details' }
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
    });
  });

  describe('End-to-End Flow', function () {
    it('should complete full flow: upload → store → verify → retrieve', async function () {
      // Create a new test document
      const e2eContent = Buffer.from('End-to-end test content');
      const e2eFileName = `e2e-${Date.now()}.txt`;
      const e2eUserId = `e2e-user-${Date.now()}`;

      // Step 1: Upload to IPFS
      const uploadResult = await ipfsService.uploadFile(e2eContent, e2eFileName);
      expect(uploadResult.success).to.be.true;

      // Step 2: Store in blockchain
      const storeResult = await documentStorageService.storeDocument(
        uploadResult.cid,
        e2eUserId,
        'e2e_test'
      );
      expect(storeResult.success).to.be.true;

      // Step 3: Verify storage
      const verifyResult = await documentStorageService.getDocument(uploadResult.cid);
      expect(verifyResult.success).to.be.true;
      expect(verifyResult.cid).to.equal(uploadResult.cid);
      expect(verifyResult.userId).to.equal(e2eUserId);

      // Step 4: Retrieve from IPFS
      const retrieveResult = await ipfsService.getFile(uploadResult.cid);
      expect(retrieveResult.success).to.be.true;
      expect(Buffer.compare(retrieveResult.content, e2eContent)).to.equal(0);

      // Step 5: Log audit event
      const auditResult = await blockchainService.logAuditHash(
        crypto.createHash('sha256').update(e2eContent).digest('hex'),
        'document_upload'
      );
      expect(auditResult.success).to.be.true;
    });
  });
});