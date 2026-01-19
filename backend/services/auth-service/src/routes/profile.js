const express = require('express')

const router = express.Router()

// All profile routes have been split into separate files:
// - profileCore.js - Core profile operations (GET /profile, GET /me, PATCH /profile)
// - profileAvatar.js - Avatar upload/delete operations
// - profilePassword.js - Password change operations
// - profileEmail.js - Email change operations
// - profileIdVerification.js - ID verification operations
// - profileAdmin.js - Admin user management operations
// - profileBusinessOwner.js - Business owner profile operations (name, contact, audit-history, approvals, verification)
// - profileFirstLogin.js - First login credentials change

// This file is kept for backward compatibility but is now empty.
// All routes are registered in routes/index.js

module.exports = router
