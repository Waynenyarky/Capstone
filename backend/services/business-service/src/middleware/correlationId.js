const { randomUUID } = require('crypto');

/**
 * Correlation ID Middleware
 * Generates and attaches correlation IDs to requests for tracking
 */

function correlationIdMiddleware(req, res, next) {
  // Get correlation ID from header or generate new one
  const correlationId = req.get('X-Correlation-ID') || randomUUID();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Add to response headers
  res.set('X-Correlation-ID', correlationId);
  
  next();
}

module.exports = correlationIdMiddleware;
