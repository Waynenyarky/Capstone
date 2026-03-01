/**
 * CSRF protection via double-submit cookie (REQUIREMENT IAS-2.7).
 * For state-changing requests (POST/PUT/PATCH/DELETE), requires header to match cookie value.
 */

const crypto = require('crypto');

const DEFAULT_COOKIE_NAME = 'csrf-token';
const DEFAULT_HEADER_NAME = 'x-csrf-token';
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Create middleware that verifies CSRF token for mutating requests.
 * Must be used after cookie-parser. Safe methods (GET, HEAD, OPTIONS) are skipped.
 * @param {object} options
 * @param {string} [options.cookieName] - Cookie name (default: csrf-token)
 * @param {string} [options.headerName] - Header name (default: x-csrf-token)
 * @param {string[]} [options.skipPaths] - Paths to skip (e.g. ['/api/auth/csrf-token'])
 * @param {boolean} [options.disabled] - If true, middleware is a no-op (e.g. when DISABLE_CSRF=true)
 */
function createCsrfMiddleware(options = {}) {
  const cookieName = options.cookieName || DEFAULT_COOKIE_NAME;
  const headerName = options.headerName || DEFAULT_HEADER_NAME;
  const skipPaths = new Set(options.skipPaths || []);
  const disabled = options.disabled === true;

  return function csrfMiddleware(req, res, next) {
    if (disabled) return next();
    if (!MUTATING_METHODS.includes(req.method)) return next();

    const path = (req.baseUrl || '') + (req.path || '');
    const normalized = path.replace(/\/$/, '') || '/';
    if (skipPaths.has(normalized) || [...skipPaths].some((p) => normalized === p || normalized.startsWith(p + '/'))) return next();

    const cookieToken = req.cookies && req.cookies[cookieName];
    const headerToken = req.get && req.get(headerName);

    // If no CSRF cookie is present (e.g. native mobile app), skip check so API clients can call mutating endpoints.
    if (!cookieToken) return next();

    if (!headerToken || cookieToken !== headerToken) {
      return res.status(403).json({
        error: {
          code: 'csrf_invalid',
          message: 'Invalid or missing CSRF token. Refresh the page and try again.',
        },
      });
    }
    next();
  };
}

/**
 * Generate a new CSRF token and set it in a cookie; return the token for the response.
 * SPA can read from cookie or use the returned value and send in header on mutating requests.
 * @param {object} options
 * @param {string} [options.cookieName]
 * @param {string} [options.headerName]
 * @param {boolean} [options.secure] - Set secure flag on cookie
 * @param {string} [options.sameSite] - 'lax' or 'strict'
 * @param {number} [options.maxAge] - Cookie max age in seconds
 */
function getCsrfTokenHandler(options = {}) {
  const cookieName = options.cookieName || DEFAULT_COOKIE_NAME;
  const secure = options.secure !== false && process.env.NODE_ENV === 'production';
  const sameSite = options.sameSite || 'lax';
  const maxAge = options.maxAge || 24 * 60 * 60; // 24 hours

  return function (req, res) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(cookieName, token, {
      httpOnly: false, // So SPA can read and send in header
      secure,
      sameSite,
      maxAge: maxAge * 1000,
      path: '/',
    });
    res.json({ csrfToken: token });
  };
}

module.exports = { createCsrfMiddleware, getCsrfTokenHandler, DEFAULT_COOKIE_NAME, DEFAULT_HEADER_NAME };
