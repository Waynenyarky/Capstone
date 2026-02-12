/**
 * Service-to-service auth: require X-API-Key header for write endpoints.
 * Protects /log, /store-document, /register-user from unauthorized callers.
 */
const respond = require('./respond');

function requireServiceAuth(req, res, next) {
  const expectedKey = process.env.AUDIT_SERVICE_API_KEY;
  const providedKey = req.headers['x-api-key'];

  if (!expectedKey) {
    // In dev, allow when no key configured (backward compat)
    if (process.env.NODE_ENV === 'production') {
      return respond.error(res, 503, 'service_auth_misconfigured', 'AUDIT_SERVICE_API_KEY not set');
    }
    return next();
  }

  if (!providedKey || providedKey !== expectedKey) {
    return respond.error(res, 401, 'service_auth_required', 'Valid X-API-Key header required');
  }
  next();
}

module.exports = { requireServiceAuth };
