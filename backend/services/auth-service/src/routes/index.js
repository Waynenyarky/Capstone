const express = require('express')
const { createCsrfMiddleware, getCsrfTokenHandler } = require('../lib/csrf')

const signupRouter = require('./signup')
const loginRouter = require('./login')
const logoutRouter = require('./logout')
const passwordResetRouter = require('./passwordReset')
const deleteAccountRouter = require('./deleteAccount')
const profileRouter = require('./profile')
const profileAvatarRouter = require('./profileAvatar')
const profilePasswordRouter = require('./profilePassword')
const profileEmailRouter = require('./profileEmail')
const profileCoreRouter = require('./profileCore')
const profileAdminRouter = require('./profileAdmin')
const profileBusinessOwnerRouter = require('./profileBusinessOwner')
const profileFirstLoginRouter = require('./profileFirstLogin')
const auditRouter = require('./audit')
const mfaRouter = require('./mfa')
const mfaBootstrapRouter = require('./mfaBootstrap')
const webauthnRouter = require('./webauthn')
const staffRecoveryRouter = require('./staffRecovery')
const staffDeletionRouter = require('./staffDeletion')
const adminDeletionRouter = require('./adminDeletion')
const adminStepUpRouter = require('./adminStepUp')
const sessionRouter = require('./session')
const adminUsersRouter = require('./adminUsers')
const registerWalkInRouter = require('./registerWalkIn')

const router = express.Router()

// REQUIREMENT IAS-2.7: CSRF token endpoint (double-submit cookie); SPA sends token in X-CSRF-Token header on mutating requests
const csrfDisabled = process.env.DISABLE_CSRF === 'true' || process.env.NODE_ENV === 'test'
router.get('/csrf-token', getCsrfTokenHandler({ cookieName: 'csrf-token-auth', sameSite: 'lax' }))
router.use(createCsrfMiddleware({ 
  cookieName: 'csrf-token-auth',
  skipPaths: [
    '/api/auth/csrf-token', 
    '/api/auth/login/verify-totp'  // TOTP verification is a public auth endpoint, exempt from CSRF
  ], 
  disabled: csrfDisabled 
}))

// Compose feature routers under /api/auth
router.use('/', signupRouter)
router.use('/', loginRouter)
router.use('/', logoutRouter)
router.use('/', passwordResetRouter)
router.use('/', deleteAccountRouter)
router.use('/', profileRouter)
router.use('/', profileAvatarRouter)
router.use('/', profilePasswordRouter)
router.use('/', profileEmailRouter)
router.use('/', profileCoreRouter)
router.use('/audit', auditRouter)
router.use('/', profileBusinessOwnerRouter) // Register before admin routes to avoid path conflicts
router.use('/', profileAdminRouter)
router.use('/', profileFirstLoginRouter)
router.use('/', mfaRouter)
router.use('/', mfaBootstrapRouter)
router.use('/', webauthnRouter)
router.use('/', staffRecoveryRouter)
router.use('/', staffDeletionRouter)
router.use('/', adminDeletionRouter)
router.use('/', adminStepUpRouter)
router.use('/', sessionRouter)
router.use('/', adminUsersRouter)
router.use('/', registerWalkInRouter)

module.exports = router
