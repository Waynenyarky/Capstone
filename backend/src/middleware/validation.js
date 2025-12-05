const Joi = require('joi')
const respond = require('./respond')

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body || {}, {
      abortEarly: false,
      stripUnknown: true,
    })
    if (error) {
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