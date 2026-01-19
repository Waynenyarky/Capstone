// Simple UUID generator fallback
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Node.js versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Structured Logger
 * Provides JSON format logs with correlation IDs for request tracking
 */

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const currentLevel = this.logLevels[this.logLevel] || 2;
    const messageLevel = this.logLevels[level] || 2;
    return messageLevel <= currentLevel;
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: 'backend',
      ...metadata,
    };

    // Include correlation ID if available
    if (metadata.correlationId) {
      logEntry.correlationId = metadata.correlationId;
    }

    // Include request info if available
    if (metadata.request) {
      logEntry.request = {
        method: metadata.request.method,
        path: metadata.request.path,
        ip: metadata.request.ip,
        userAgent: metadata.request.userAgent,
      };
    }

    // Include user info if available
    if (metadata.userId) {
      logEntry.userId = metadata.userId;
    }

    // Include error details if available
    if (metadata.error) {
      logEntry.error = {
        name: metadata.error.name,
        message: metadata.error.message,
        stack: metadata.error.stack,
        code: metadata.error.code,
      };
    }

    return logEntry;
  }

  /**
   * Output log entry
   */
  output(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, metadata);
    
    // In production, output JSON; in development, use pretty format
    if (process.env.NODE_ENV === 'production' || process.env.JSON_LOGS === 'true') {
      console.log(JSON.stringify(logEntry));
    } else {
      // Pretty format for development
      const prefix = `[${logEntry.timestamp}] [${logEntry.level}]`;
      const correlation = logEntry.correlationId ? ` [${logEntry.correlationId.substring(0, 8)}]` : '';
      console.log(`${prefix}${correlation} ${message}`, metadata.error || metadata);
    }
  }

  /**
   * Log error
   */
  error(message, metadata = {}) {
    this.output('error', message, { ...metadata, level: 'error' });
  }

  /**
   * Log warning
   */
  warn(message, metadata = {}) {
    this.output('warn', message, { ...metadata, level: 'warn' });
  }

  /**
   * Log info
   */
  info(message, metadata = {}) {
    this.output('info', message, { ...metadata, level: 'info' });
  }

  /**
   * Log debug
   */
  debug(message, metadata = {}) {
    this.output('debug', message, { ...metadata, level: 'debug' });
  }

  /**
   * Log request
   */
  logRequest(req, res, responseTime = null) {
    const metadata = {
      correlationId: req.correlationId,
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      },
      response: {
        statusCode: res.statusCode,
      },
    };

    if (responseTime !== null) {
      metadata.responseTime = responseTime;
    }

    if (req._userId) {
      metadata.userId = req._userId;
    }

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    this.output(level, `${req.method} ${req.path} ${res.statusCode}`, metadata);
  }

  /**
   * Log database query
   */
  logDatabaseQuery(operation, collection, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
    this.output(level, `DB ${operation} on ${collection}`, {
      ...metadata,
      database: {
        operation,
        collection,
        duration,
      },
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details, metadata = {}) {
    this.warn(`Security event: ${eventType}`, {
      ...metadata,
      security: {
        eventType,
        details,
        severity: metadata.severity || 'medium',
      },
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, unit = 'ms', metadata = {}) {
    const level = value > 5000 ? 'warn' : value > 1000 ? 'info' : 'debug';
    this.output(level, `Performance: ${metric}`, {
      ...metadata,
      performance: {
        metric,
        value,
        unit,
      },
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
