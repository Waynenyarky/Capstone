const express = require('express')

const signupRouter = require('./signup')
const loginRouter = require('./login')
const passwordResetRouter = require('./passwordReset')
const deleteAccountRouter = require('./deleteAccount')
const profileRouter = require('./profile')
const mfaRouter = require('./mfa')
const webauthnRouter = require('./webauthn')
const verificationRouter = require('./verification')

const router = express.Router()

// Compose feature routers under /api/auth
router.use('/', signupRouter)
router.use('/', loginRouter)
router.use('/', passwordResetRouter)
router.use('/', deleteAccountRouter)
router.use('/', profileRouter)
router.use('/', mfaRouter)
router.use('/', webauthnRouter)
router.use('/', verificationRouter)

module.exports = router
