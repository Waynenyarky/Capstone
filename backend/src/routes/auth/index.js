const express = require('express')

const signupRouter = require('./signup')
const loginRouter = require('./login')
const passwordResetRouter = require('./passwordReset')
const deleteAccountRouter = require('./deleteAccount')
const profileRouter = require('./profile')
const mfaRouter = require('./mfa')
const mfaBootstrapRouter = require('./mfaBootstrap')
const webauthnRouter = require('./webauthn')
const auditRouter = require('./audit')
const staffRecoveryRouter = require('./staffRecovery')
const staffDeletionRouter = require('./staffDeletion')
const sessionRouter = require('./session')
const adminUsersRouter = require('./adminUsers')

const router = express.Router()

// Compose feature routers under /api/auth
router.use('/', signupRouter)
router.use('/', loginRouter)
router.use('/', passwordResetRouter)
router.use('/', deleteAccountRouter)
router.use('/', profileRouter)
router.use('/', mfaRouter)
router.use('/', mfaBootstrapRouter)
router.use('/', webauthnRouter)
router.use('/audit', auditRouter)
router.use('/', staffRecoveryRouter)
router.use('/', staffDeletionRouter)
router.use('/', sessionRouter)
router.use('/', adminUsersRouter)

module.exports = router
