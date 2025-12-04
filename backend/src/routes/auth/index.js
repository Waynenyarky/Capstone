const express = require('express')

const signupRouter = require('./signup')
const loginRouter = require('./login')
const passwordResetRouter = require('./passwordReset')
const deleteAccountRouter = require('./deleteAccount')
const profileRouter = require('./profile')

const router = express.Router()

// Compose feature routers under /api/auth
router.use('/', signupRouter)
router.use('/', loginRouter)
router.use('/', passwordResetRouter)
router.use('/', deleteAccountRouter)
router.use('/', profileRouter)

module.exports = router