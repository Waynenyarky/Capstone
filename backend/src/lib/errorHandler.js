const respond = require('../middleware/respond')
const logger = require('./logger')
const errorTracking = require('./errorTracking')

/**
 * Error Handler Utilities
 * Provides consistent, secure error handling and messages
 */

/**
 * Get user-friendly error message
 * @param {string} code - Error code
 * @param {string} defaultMessage - Default error message
 * @param {object} context - Additional context
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyMessage(code, defaultMessage, context = {}) {
  const messages = {
    // Authentication errors
    unauthorized: 'You need to be logged in to perform this action.',
    invalid_token: 'Your session has expired. Please log in again.',
    token_invalidated: 'Your session has been invalidated. Please log in again.',
    
    // Verification errors
    verification_required: 'Verification is required before making this change. Please request a verification code.',
    verification_failed: 'Invalid verification code. Please try again.',
    verification_rate_limited: 'Too many verification attempts. Please wait before requesting a new code.',
    
    // Password errors
    weak_password: 'Password does not meet security requirements. Please ensure it has at least 8 characters, including uppercase, lowercase, number, and special character.',
    password_reused: 'You cannot reuse a recently used password. Please choose a different password.',
    invalid_current_password: 'Current password is incorrect.',
    password_change_rate_limited: 'Too many password change attempts. Please try again later.',
    
    // Email errors
    email_exists: 'This email address is already in use.',
    email_change_pending: 'You have a pending email change request. Please wait for it to be applied or revert it first.',
    grace_period_expired: 'The grace period for reverting this email change has expired.',
    no_pending_change: 'No pending email change request found.',
    
    // Field permission errors
    field_restricted: 'This field cannot be edited by your role. This action has been logged.',
    field_not_allowed: 'You do not have permission to edit this field.',
    
    // Approval errors
    self_approval_not_allowed: 'You cannot approve your own change requests.',
    approval_already_processed: 'This approval request has already been processed.',
    already_voted: 'You have already voted on this approval request.',
    
    // Rate limiting
    rate_limit_exceeded: 'Too many requests. Please slow down and try again later.',
    
    // Account lockout
    account_locked: 'Your account has been temporarily locked due to too many failed attempts. Please try again later.',
    
    // Validation errors
    validation_error: 'The provided information is invalid. Please check your input and try again.',
    
    // Generic errors
    not_found: 'The requested resource was not found.',
    forbidden: 'You do not have permission to perform this action.',
    server_error: 'An unexpected error occurred. Please try again later.',
  }

  // Get message from map or use default
  let message = messages[code] || defaultMessage || 'An error occurred.'

  // Add context-specific information
  if (context.remainingMinutes) {
    message += ` Your account will be unlocked in ${context.remainingMinutes} minute(s).`
  }

  if (context.expiresAt) {
    const remainingHours = Math.ceil((new Date(context.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000))
    message += ` You have ${remainingHours} hour(s) remaining to revert this change.`
  }

  if (context.errors && Array.isArray(context.errors)) {
    message += ' ' + context.errors.join(' ')
  }

  return message
}

/**
 * Create a safe error response
 * Prevents information leakage while providing helpful messages
 * @param {Error} error - Error object
 * @param {object} options - Options
 * @returns {object} - Safe error response
 */
function createSafeErrorResponse(error, options = {}) {
  const { exposeDetails = false, logError = true, context = {} } = options

  if (logError) {
    // Use structured logging
    logger.error('Error occurred', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      ...context,
    })
    
    // Track error for monitoring
    errorTracking.trackError(error, context)
  }

  // Don't expose internal error details in production
  if (!exposeDetails && process.env.NODE_ENV === 'production') {
    return {
      code: 'server_error',
      message: 'An unexpected error occurred. Please try again later.',
    }
  }

  return {
    code: error.code || 'server_error',
    message: error.message || 'An unexpected error occurred.',
  }
}

/**
 * Handle validation errors
 * @param {Error} error - Validation error
 * @returns {object} - Formatted error response
 */
function handleValidationError(error) {
  if (error.isJoi) {
    const details = error.details.map((detail) => detail.message).join(', ')
    return {
      code: 'validation_error',
      message: getUserFriendlyMessage('validation_error', details),
      details: error.details,
    }
  }

  return {
    code: 'validation_error',
    message: getUserFriendlyMessage('validation_error', error.message),
  }
}

module.exports = {
  getUserFriendlyMessage,
  createSafeErrorResponse,
  handleValidationError,
}
