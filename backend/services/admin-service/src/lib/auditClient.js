const http = require('http')

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004'

/**
 * Sends an audit event to the audit-service for blockchain anchoring.
 * Fire-and-forget: failures are logged but never block the caller.
 */
async function logAuditEvent(eventType, userId, entityType, entityId, metadata = {}) {
  const body = JSON.stringify({
    eventType,
    userId,
    entityType,
    entityId,
    metadata,
    timestamp: new Date(),
  })

  return new Promise((resolve) => {
    try {
      const url = new URL(`${AUDIT_SERVICE_URL}/api/audit/log`)
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }
      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(data)) } catch { resolve(null) }
        })
      })
      req.on('error', (err) => {
        console.error('[AuditClient] Audit log failed (non-blocking):', err.message)
        resolve(null)
      })
      req.setTimeout(5000, () => { req.destroy(); resolve(null) })
      req.write(body)
      req.end()
    } catch (err) {
      console.error('[AuditClient] Unexpected error:', err.message)
      resolve(null)
    }
  })
}

module.exports = { logAuditEvent }
