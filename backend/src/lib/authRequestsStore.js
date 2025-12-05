// In-memory stores for auth-related verification flows.
// These singletons are imported by route modules to share state.

// Map: email(lowercased) -> { code, expiresAt, verified, resetToken }
const resetRequests = new Map()

// Map: email(lowercased) -> { code, expiresAt, verified, deleteToken }
const deleteRequests = new Map()

// Map: email(lowercased) -> { code, expiresAt, payload }
const signUpRequests = new Map()

// Map: email(lowercased) -> { code, expiresAt, verified, loginToken, userId }
const loginRequests = new Map()

module.exports = { resetRequests, deleteRequests, signUpRequests, loginRequests }