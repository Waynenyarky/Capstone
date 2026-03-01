/**
 * In-memory registry for SSE notification streams.
 * Maps userId -> Set of response objects; supports one-time stream tokens and push.
 * Single-instance only; for multi-instance use sticky sessions or Redis pub/sub.
 */

const crypto = require('crypto')

const STREAM_TOKEN_TTL_MS = 60 * 1000 // 60 seconds
const KEEPALIVE_INTERVAL_MS = 25 * 1000 // 25 seconds

/** token -> { userId, expiresAt } (one-time use; consumed when client connects) */
const streamTokens = new Map()

/** userId -> Set<res> */
const connectionsByUser = new Map()

/**
 * Issue a short-lived one-time stream token for the given user.
 * @param {string} userId - User ID
 * @returns {{ streamToken: string, expiresIn: number }}
 */
function issueStreamToken(userId) {
  const streamToken = crypto.randomBytes(24).toString('hex')
  const expiresAt = Date.now() + STREAM_TOKEN_TTL_MS
  streamTokens.set(streamToken, { userId: String(userId), expiresAt })
  return { streamToken, expiresIn: Math.floor(STREAM_TOKEN_TTL_MS / 1000) }
}

/**
 * Consume a stream token: validate, return userId, and remove token (one-time use).
 * @param {string} token - Stream token from query
 * @returns {string|null} userId or null if invalid/expired
 */
function consumeStreamToken(token) {
  if (!token || typeof token !== 'string') return null
  const entry = streamTokens.get(token)
  streamTokens.delete(token) // one-time use
  if (!entry) return null
  if (Date.now() > entry.expiresAt) return null
  return entry.userId
}

/**
 * Register an SSE connection for a user. Sets headers, starts keepalive, and cleans up on close.
 * @param {string} userId - User ID
 * @param {import('express').Response} res - Express response object
 */
function register(userId, res) {
  const uid = String(userId)
  if (!connectionsByUser.has(uid)) {
    connectionsByUser.set(uid, new Set())
  }
  const set = connectionsByUser.get(uid)
  set.add(res)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // nginx: disable buffering
  res.flushHeaders && res.flushHeaders()

  // Optional: send connected event
  try {
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
  } catch (_) { /* ignore */ }

  const keepaliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n')
    } catch (_) {
      clearInterval(keepaliveInterval)
      unregister(uid, res)
    }
  }, KEEPALIVE_INTERVAL_MS)

  res.on('close', () => {
    clearInterval(keepaliveInterval)
    unregister(uid, res)
  })
}

/**
 * Unregister an SSE connection.
 * @param {string} userId - User ID
 * @param {import('express').Response} res - Express response object
 */
function unregister(userId, res) {
  const uid = String(userId)
  const set = connectionsByUser.get(uid)
  if (set) {
    set.delete(res)
    if (set.size === 0) connectionsByUser.delete(uid)
  }
}

/**
 * Push a payload to all registered connections for the user. Removes dead connections.
 * Fire-and-forget; do not await. Call from createNotification after save.
 * @param {string} userId - User ID
 * @param {object} payload - Serializable payload (e.g. { type: 'new', notification })
 */
function push(userId, payload) {
  const uid = String(userId)
  const set = connectionsByUser.get(uid)
  if (!set || set.size === 0) return
  const data = `data: ${JSON.stringify(payload)}\n\n`
  const toRemove = []
  set.forEach((res) => {
    try {
      res.write(data)
    } catch (_) {
      toRemove.push(res)
    }
  })
  toRemove.forEach((res) => unregister(uid, res))
}

module.exports = {
  issueStreamToken,
  consumeStreamToken,
  register,
  unregister,
  push
}
