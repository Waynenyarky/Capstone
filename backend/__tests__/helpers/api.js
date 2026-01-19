const request = require('supertest')

/**
 * Make a unified request helper
 * @param {Express.Application} app - Express app
 * @param {string} method - HTTP method (get, post, patch, put, delete)
 * @param {string} path - Request path
 * @param {object} options - Request options
 * @param {string} options.token - JWT token for authentication
 * @param {object} options.body - Request body
 * @param {object} options.query - Query parameters
 * @param {object} options.headers - Additional headers
 * @returns {Promise<Response>}
 */
function makeRequest(app, method, path, options = {}) {
  const { token, body, query, headers = {} } = options
  
  let req = request(app)[method](path)
  
  if (token) {
    req = req.set('Authorization', `Bearer ${token}`)
  }
  
  if (Object.keys(headers).length > 0) {
    Object.entries(headers).forEach(([key, value]) => {
      req = req.set(key, value)
    })
  }
  
  if (query) {
    req = req.query(query)
  }
  
  if (body) {
    req = req.send(body)
  }
  
  return req
}

/**
 * Assert success response
 * @param {Response} response - Supertest response
 * @param {object} expectedData - Expected data (optional)
 * @returns {void}
 */
function expectSuccess(response, expectedData = null) {
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(300)
  
  if (expectedData) {
    if (typeof expectedData === 'object') {
      Object.entries(expectedData).forEach(([key, value]) => {
        expect(response.body[key]).toEqual(value)
      })
    }
  }
}

/**
 * Assert error response
 * @param {Response} response - Supertest response
 * @param {string} code - Expected error code (optional)
 * @param {number} status - Expected status code (optional)
 * @returns {void}
 */
function expectError(response, code = null, status = null) {
  if (status !== null) {
    expect(response.status).toBe(status)
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400)
  }
  
  expect(response.body.error).toBeDefined()
  
  if (code) {
    expect(response.body.error.code).toBe(code)
  }
}

module.exports = {
  makeRequest,
  expectSuccess,
  expectError,
}
