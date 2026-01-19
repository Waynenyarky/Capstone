/**
 * Mock implementations for blockchain and IPFS services
 * Allows running integration tests without Docker infrastructure
 */

const path = require('path');
const blockchainServicePath = path.resolve(__dirname, '../../services/audit-service/src/lib/blockchainService');

const mockBlockchainData = {
  users: new Map(), // userId -> { address, profileHash, exists: true }
  documents: new Map(), // docId -> { cid, userId, timestamp }
  auditLogs: [], // Array of audit log entries
  nextTxHash: 0
};

const mockIPFSData = {
  files: new Map(), // cid -> { content, filename, size }
  nextCid: 0
};

/**
 * Mock Blockchain Service
 */
const mockBlockchainService = {
  initialized: true,
  contracts: {
    auditLog: {},
    userRegistry: {},
    documentStorage: {},
    accessControl: {}
  },

  isAvailable() {
    return true;
  },

  async initialize() {
    // Mock initialization - always succeeds
    return;
  },

  async logAuditHash(hash, eventType) {
    const txHash = `0x${(++mockBlockchainData.nextTxHash).toString(16).padStart(64, '0')}`;
    mockBlockchainData.auditLogs.push({
      hash,
      eventType,
      txHash,
      timestamp: Date.now()
    });

    return {
      success: true,
      txHash,
      blockNumber: Math.floor(Date.now() / 1000)
    };
  },

  async logCriticalEvent(eventType, details) {
    const txHash = `0x${(++mockBlockchainData.nextTxHash).toString(16).padStart(64, '0')}`;
    mockBlockchainData.auditLogs.push({
      eventType,
      details,
      txHash,
      timestamp: Date.now(),
      critical: true
    });

    return {
      success: true,
      txHash,
      blockNumber: Math.floor(Date.now() / 1000)
    };
  }
};

/**
 * Mock UserRegistry Service
 */
const mockUserRegistryService = {
  async initialize() {
    // Mock initialization
    return;
  },

  async registerUser(userId, userAddress, profileHash) {
    mockBlockchainData.users.set(userId, {
      address: userAddress.toLowerCase(),
      profileHash: `0x${profileHash.padStart(64, '0')}`,
      exists: true
    });

    const txHash = `0x${(++mockBlockchainData.nextTxHash).toString(16).padStart(64, '0')}`;
    return {
      success: true,
      txHash
    };
  },

  async getUserProfileHash(userId) {
    const user = mockBlockchainData.users.get(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      userAddress: user.address,
      profileHash: user.profileHash,
      lastUpdatedAt: user.lastUpdatedAt || Date.now()
    };
  },

  async updateProfileHash(userId, newProfileHash) {
    const user = mockBlockchainData.users.get(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    user.profileHash = `0x${newProfileHash.padStart(64, '0')}`;
    user.lastUpdatedAt = Date.now();

    const txHash = `0x${(++mockBlockchainData.nextTxHash).toString(16).padStart(64, '0')}`;
    return {
      success: true,
      txHash
    };
  },

  async userExists(userId) {
    return mockBlockchainData.users.has(userId);
  },

  async getUserIdByAddress(userAddress) {
    for (const [userId, user] of mockBlockchainData.users.entries()) {
      if (user.address === userAddress.toLowerCase()) {
        return {
          success: true,
          userId
        };
      }
    }

    return {
      success: false,
      error: 'User not found'
    };
  }
};

/**
 * Mock DocumentStorage Service
 */
const mockDocumentStorageService = {
  async initialize() {
    // Mock initialization
    return;
  },

  async storeDocument(cid, userId, docType = 'profile') {
    const docId = `${userId}_${docType}_${Date.now()}`;
    mockBlockchainData.documents.set(docId, {
      cid,
      userId,
      docType,
      timestamp: Date.now()
    });

    const txHash = `0x${(++mockBlockchainData.nextTxHash).toString(16).padStart(64, '0')}`;
    return {
      success: true,
      txHash,
      docId
    };
  },

  async getDocument(cid) {
    // Find document by CID instead of docId
    for (const [docId, doc] of mockBlockchainData.documents.entries()) {
      if (doc.cid === cid) {
        return {
          success: true,
          cid: doc.cid,
          userId: doc.userId,
          docType: doc.docType,
          timestamp: doc.timestamp,
          docId
        };
      }
    }

    return {
      success: false,
      error: 'Document not found'
    };
  },

  async getDocumentsByUser(userId) {
    const userDocs = [];
    for (const [docId, doc] of mockBlockchainData.documents.entries()) {
      if (doc.userId === userId) {
        userDocs.push({
          docId,
          ...doc
        });
      }
    }

    return {
      success: true,
      documents: userDocs
    };
  }
};

/**
 * Mock IPFS Service
 */
const mockIPFSService = {
  isAvailable() {
    return true;
  },

  async uploadFile(buffer, filename) {
    const cid = `QmMock${(++mockIPFSData.nextCid).toString(16).padStart(8, '0')}`;
    mockIPFSData.files.set(cid, {
      content: buffer,
      filename,
      size: buffer.length,
      uploadedAt: Date.now()
    });

    return {
      success: true,
      cid,
      size: buffer.length
    };
  },

  async uploadJSON(data) {
    const buffer = Buffer.from(JSON.stringify(data));
    const cid = `QmMock${(++mockIPFSData.nextCid).toString(16).padStart(8, '0')}`;

    mockIPFSData.files.set(cid, {
      content: buffer,
      filename: 'data.json',
      size: buffer.length,
      uploadedAt: Date.now()
    });

    return {
      success: true,
      cid,
      size: buffer.length
    };
  },

  async getFile(cid) {
    const file = mockIPFSData.files.get(cid);
    if (!file) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    return {
      success: true,
      content: file.content,
      filename: file.filename,
      size: file.size
    };
  },

  async pinFile(cid) {
    // Mock pinning - just return success
    return {
      success: true,
      cid
    };
  },

  async unpinFile(cid) {
    // Mock unpinning - just return success
    return {
      success: true,
      cid
    };
  }
};

/**
 * Setup function to apply mocks for blockchain integration tests
 */
function setupBlockchainMocks() {
  // Mock the blockchain service
  jest.mock(blockchainServicePath, () => mockBlockchainService);

  // Mock the user registry service
  jest.mock('../../services/audit-service/src/lib/userRegistryService', () => mockUserRegistryService);

  // Mock the document storage service
  jest.mock('../../services/audit-service/src/lib/documentStorageService', () => mockDocumentStorageService);

  // Mock the IPFS service
  jest.mock('../../services/business-service/src/lib/ipfsService', () => mockIPFSService);
  jest.mock('../../services/auth-service/src/lib/ipfsService', () => mockIPFSService);
}

/**
 * Reset mock data between tests
 */
function resetBlockchainMocks() {
  mockBlockchainData.users.clear();
  mockBlockchainData.documents.clear();
  mockBlockchainData.auditLogs.length = 0;
  mockBlockchainData.nextTxHash = 0;

  mockIPFSData.files.clear();
  mockIPFSData.nextCid = 0;
}

/**
 * Get current mock data for assertions
 */
function getMockData() {
  return {
    blockchain: { ...mockBlockchainData },
    ipfs: { ...mockIPFSData }
  };
}

module.exports = {
  setupBlockchainMocks,
  resetBlockchainMocks,
  getMockData,
  mockBlockchainService,
  mockUserRegistryService,
  mockDocumentStorageService,
  mockIPFSService
};