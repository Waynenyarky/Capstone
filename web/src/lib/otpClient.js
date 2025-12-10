// Frontend-only OTP client for dev/offline mode
// - Generates 6-digit numeric codes
// - TTL default 3 minutes (configurable per-call)
// - Single-use: codes are consumed on successful verify
// - Persists state in localStorage so reloads keep codes

const STORAGE_KEY = 'capstone:otpClient:v1'

function _nowMs() {
  return Date.now()
}

function _loadStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function _saveStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

function _normalizeEmail(email) {
  return String(email || '').toLowerCase()
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Public API
export function isEnabled() {
  try {
    return window.localStorage?.getItem('MFA_OFFLINE') === 'true'
  } catch {
    return false
  }
}

// Generate and store an OTP for the given email. ttlMs defaults to 3 minutes.
export function generateOtp(email, { ttlMs = 3 * 60 * 1000 } = {}) {
  const key = _normalizeEmail(email)
  if (!key) throw new Error('email required')
  const code = generateCode()
  const store = _loadStore()
  store[key] = { code: String(code), expiresAt: _nowMs() + Number(ttlMs), used: false }
  _saveStore(store)
  return code
}

// Verify the code for the given email. If valid and not expired and not used,
// mark consumed (single-use) and return true. Otherwise return false.
export function verifyOtp(email, code) {
  const key = _normalizeEmail(email)
  if (!key) return false
  const store = _loadStore()
  const entry = store[key]
  if (!entry) return false
  if (entry.used === true) return false
  if (String(entry.code) !== String(code)) return false
  if (_nowMs() > Number(entry.expiresAt)) return false
  // consume
  entry.used = true
  _saveStore(store)
  return true
}

// Utility: clear any stored OTPs for an email (used after successful verify or tests)
export function clearOtp(email) {
  const key = _normalizeEmail(email)
  const store = _loadStore()
  if (store[key]) {
    delete store[key]
    _saveStore(store)
  }
}

// For debugging: list entries (not for production)
export function _debugList() {
  return _loadStore()
}

export default { isEnabled, generateOtp, verifyOtp, clearOtp, _debugList }
