/**
 * Setup email mocks
 * Note: The mailer.js uses REST API and has a mock mode when EMAIL_API_KEY is not set
 * This function ensures the environment is set correctly for mocking
 */
function setupEmailMocks() {
  // Email mocking is handled by mailer.js when EMAIL_API_PROVIDER is 'mock'
  // or when EMAIL_API_KEY is not set - it logs to console
  // No additional mocking needed
}

/**
 * Setup blockchain mocks
 * Note: Blockchain is disabled via AUDIT_CONTRACT_ADDRESS='' env var
 */
function setupBlockchainMocks() {
  // Blockchain is disabled in test environment via env var
  // No additional mocking needed
}

/**
 * Setup external API mocks (Google OAuth, etc.)
 * These should be mocked using jest.mock() in individual test files
 */
function setupExternalAPIMocks() {
  // External API mocks should be set up in individual test files
  // using jest.mock() for specific modules
}

/**
 * Reset all mocks
 * Call this in beforeEach/afterEach to ensure clean state
 */
function resetMocks() {
  // Clear any module cache if needed
  // Most mocks are handled by jest.mock() which auto-resets
}

module.exports = {
  setupEmailMocks,
  setupBlockchainMocks,
  setupExternalAPIMocks,
  resetMocks,
}
