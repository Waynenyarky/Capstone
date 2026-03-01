/**
 * Short-lived verification store for MFA disable / disable-undo.
 * After user proves identity via passkey, we set a token here; the actual
 * disable-request or disable-undo must run within TTL_MS and consume it.
 */
const TTL_MS = 2 * 60 * 1000 // 2 minutes

const disableRequestVerified = new Map() // userId -> timestamp
const disableUndoVerified = new Map()

function getAndDelete(map, userId) {
  const t = map.get(String(userId))
  map.delete(String(userId))
  if (!t || Date.now() - t > TTL_MS) return false
  return true
}

function set(map, userId) {
  map.set(String(userId), Date.now())
}

module.exports = {
  setDisableRequestVerified: (userId) => set(disableRequestVerified, userId),
  consumeDisableRequestVerified: (userId) => getAndDelete(disableRequestVerified, userId),
  setDisableUndoVerified: (userId) => set(disableUndoVerified, userId),
  consumeDisableUndoVerified: (userId) => getAndDelete(disableUndoVerified, userId),
}
