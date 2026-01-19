/**
 * Integration Tests: User Registry → Blockchain Flow
 *
 * Tests the complete flow:
 * 1. Calculate user profile hash
 * 2. Register user in UserRegistry contract
 * 3. Upload profile JSON to IPFS
 * 4. Store profile document in DocumentStorage
 * 5. Verify data on blockchain
 */

const { expect } = require('chai');
const crypto = require('crypto');

// Setup blockchain mocks for testing without Docker infrastructure
const { setupBlockchainMocks, resetBlockchainMocks } = require('../helpers/blockchain-mocks');

// Apply mocks before importing services
setupBlockchainMocks();

// Import services (now mocked)
const userRegistryService = require('../../services/audit-service/src/lib/userRegistryService');
const documentStorageService = require('../../services/audit-service/src/lib/documentStorageService');
const ipfsService = require('../../services/business-service/src/lib/ipfsService');
const blockchainService = require('../../services/audit-service/src/lib/blockchainService');

describe('User Registry → Blockchain Integration', function () {
  jest.setTimeout(30000); // Increase timeout for blockchain operations

  let testUserId;
  let testUserAddress;
  let testProfileHash;
  let testProfileIpfsCid;

  beforeAll(async function () {
    // Reset mocks for clean test state
    resetBlockchainMocks();

    // Initialize mock services
    await blockchainService.initialize();
    await userRegistryService.initialize();
    await documentStorageService.initialize();

    // Generate test data
    testUserId = `test-user-${Date.now()}`;
    testUserAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
    testProfileHash = crypto.createHash('sha256').update(JSON.stringify({ userId: testUserId, email: 'test@example.com' })).digest('hex');
  });

  describe('User Registration', function () {
    it('should register user in UserRegistry contract', async function () {
      const result = await userRegistryService.registerUser(
        testUserId,
        testUserAddress,
        testProfileHash
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
      expect(result.txHash).to.be.a('string');
    });

    it('should retrieve user profile hash from blockchain', async function () {
      const result = await userRegistryService.getUserProfileHash(testUserId);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('userAddress');
      expect(result.userAddress.toLowerCase()).to.equal(testUserAddress.toLowerCase());
      expect(result).to.have.property('profileHash');
      expect(result.profileHash).to.equal(`0x${testProfileHash.padStart(64, '0')}`);
    });

    it('should check if user exists', async function () {
      const exists = await userRegistryService.userExists(testUserId);
      expect(exists).to.be.true;
    });

    it('should get userId by Ethereum address', async function () {
      const result = await userRegistryService.getUserIdByAddress(testUserAddress);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('userId');
      expect(result.userId).to.equal(testUserId);
    });
  });

  describe('Profile Hash Update', function () {
    it('should update profile hash for existing user', async function () {
      const newProfileHash = crypto.createHash('sha256').update(JSON.stringify({ userId: testUserId, updated: true })).digest('hex');

      const result = await userRegistryService.updateProfileHash(testUserId, newProfileHash);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
    });

    it('should retrieve updated profile hash', async function () {
      const result = await userRegistryService.getUserProfileHash(testUserId);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('lastUpdatedAt');
      expect(result.lastUpdatedAt).to.be.greaterThan(0);
    });
  });

  describe('Profile Document Storage', function () {
    it('should upload profile JSON to IPFS', async function () {
      const profileData = {
        userId: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await ipfsService.uploadJSON(profileData);
      expect(result).to.have.property('cid');
      expect(result.cid).to.be.a('string');

      testProfileIpfsCid = result.cid;
      await ipfsService.pinFile(testProfileIpfsCid);
    });

    it('should store profile document in DocumentStorage', async function () {
      expect(testProfileIpfsCid).to.exist;

      const result = await documentStorageService.storeDocument(
        testProfileIpfsCid,
        testUserId,
        'profile'
      );

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('txHash');
    });

    it('should retrieve profile document from blockchain', async function () {
      const result = await documentStorageService.getDocument(testProfileIpfsCid);

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      expect(result).to.have.property('userId');
      expect(result.userId).to.equal(testUserId);
    });

    it('should retrieve profile JSON from IPFS', async function () {
      const retrievedData = await ipfsService.getFile(testProfileIpfsCid);
      const profileData = JSON.parse(retrievedData.content.toString());

      expect(profileData).to.have.property('userId');
      expect(profileData.userId).to.equal(testUserId);
      expect(profileData).to.have.property('email');
      expect(profileData.email).to.equal('test@example.com');
    });
  });

  describe('End-to-End User Migration Flow', function () {
    it('should complete full user migration flow', async function () {
      const userId = `e2e-user-${Date.now()}`;
      const userAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
      const profileData = {
        userId,
        email: 'e2e@example.com',
        firstName: 'E2E',
        lastName: 'Test',
      };

      // Step 1: Register user
      const registerResult = await userRegistryService.registerUser(
        userId,
        userAddress,
        crypto.createHash('sha256').update(JSON.stringify(profileData)).digest('hex')
      );
      expect(registerResult.success).to.be.true;

      // Step 2: Upload to IPFS
      const ipfsResult = await ipfsService.uploadJSON(profileData);
      expect(ipfsResult.success).to.be.true;

      // Step 3: Store in blockchain
      const storeResult = await documentStorageService.storeDocument(
        ipfsResult.cid,
        userId,
        'profile'
      );
      expect(storeResult.success).to.be.true;

      // Step 4: Verify complete flow
      const userExists = await userRegistryService.userExists(userId);
      expect(userExists).to.be.true;

      const docResult = await documentStorageService.getDocument(ipfsResult.cid);
      expect(docResult.success).to.be.true;
      expect(docResult.userId).to.equal(userId);
    });
  });
});