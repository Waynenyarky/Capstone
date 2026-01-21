const Joi = require('joi')
const respond = require('./respond')

function validateBody(schema) {
  return (req, res, next) => {
    // Store original body for role check
    req._originalBody = req.body || {}
    
    const { error, value } = schema.validate(req.body || {}, {
      abortEarly: false,
      stripUnknown: true,
    })
    if (error) {
      // Check if error is due to password weakness (custom validation)
      // Look for password field errors with special error message format
      const passwordError = error.details.find(d => 
        Array.isArray(d.path) && d.path.includes('password') && 
        d.message && typeof d.message === 'string' && d.message.startsWith('WEAK_PASSWORD_ERROR:')
      )
      if (passwordError) {
        try {
          const errorData = passwordError.message.replace('WEAK_PASSWORD_ERROR:', '')
          const passwordErrors = JSON.parse(errorData)
          return respond.error(res, 400, 'weak_password', 'Password does not meet requirements', passwordErrors)
        } catch (e) {
          // Fallback if parsing fails
          return respond.error(res, 400, 'weak_password', 'Password does not meet requirements')
        }
      }
      
      // Check if error is due to forbidden field (like role)
      const hasForbiddenError = error.details.some(d => d.type === 'any.unknown' || d.type === 'any.forbidden')
      if (hasForbiddenError && req._originalBody.role !== undefined) {
        // Return 403 for forbidden fields instead of 400
        return respond.error(res, 403, 'field_restricted', 'Role cannot be changed through this endpoint')
      }
      
      const details = Array.isArray(error.details)
        ? error.details.map((d) => ({ message: d.message, path: d.path }))
        : [{ message: error.message }]
      return respond.error(res, 400, 'validation_error', 'Invalid request', details)
    }
    req.body = value
    next()
  }
}

module.exports = { validateBody, Joi }