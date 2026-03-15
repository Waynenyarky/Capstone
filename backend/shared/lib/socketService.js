/**
 * Shared Socket.io service for realtime updates across the application.
 * 
 * Events emitted:
 * - application:created - New application submitted
 * - application:updated - Application status changed
 * - application:claimed - Application claimed by officer
 * - application:released - Application released by officer
 * - payment:created - New payment recorded
 * - payment:verified - Payment verified
 * - inspection:scheduled - Inspection scheduled
 * - inspection:completed - Inspection completed
 */

// Socket.io Server class - will be set by the calling service
let SocketIOServer = null

// Try to require socket.io, but don't fail if not available
// (the calling service will pass it in)
try {
  SocketIOServer = require('socket.io').Server
} catch (err) {
  // Will be provided by initializeSocket
}

let jwt = null
try {
  jwt = require('jsonwebtoken')
} catch (err) {
  // Will be provided by initializeSocket
}

let io = null
const connectedUsers = new Map() // Map<userId, Set<socketId>>

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @param {Object} options - Socket.io options
 * @param {Object} options.SocketIO - Socket.io Server class (optional, for when require fails)
 * @param {Object} options.jwt - jsonwebtoken module (optional, for when require fails)
 */
function initializeSocket(httpServer, options = {}) {
  if (io) {
    console.warn('[Socket] Already initialized')
    return io
  }

  // Use provided modules or fallback to required ones
  const Server = options.SocketIO || SocketIOServer
  const jwtModule = options.jwt || jwt

  if (!Server) {
    console.error('[Socket] socket.io Server class not available')
    return null
  }

  const corsOrigin = process.env.CORS_ORIGIN || '*'
  
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin === '*' ? true : corsOrigin.split(','),
      credentials: true,
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    ...options,
  })

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    
    if (!token) {
      // Allow anonymous connections for public updates, but they won't receive user-specific events
      socket.user = null
      return next()
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret'
      const decoded = jwt.verify(token, jwtSecret)
      socket.user = decoded
      next()
    } catch (err) {
      console.warn('[Socket] Invalid token:', err.message)
      socket.user = null
      next() // Still allow connection, just without user context
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user?.userId || socket.user?._id || socket.user?.id
    const userRole = socket.user?.role
    
    console.log(`[Socket] Client connected: ${socket.id}`, { userId, role: userRole })

    // Track connected users
    if (userId) {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set())
      }
      connectedUsers.get(userId).add(socket.id)

      // Join user-specific room
      socket.join(`user:${userId}`)
    }

    // Join role-based rooms for broadcast
    if (userRole) {
      socket.join(`role:${userRole}`)
      
      // Officers and managers also join the staff room
      if (['lgu_officer', 'lgu_manager', 'staff', 'admin'].includes(userRole)) {
        socket.join('role:staff')
      }
    }

    // Handle room subscriptions
    socket.on('subscribe:business', (businessId) => {
      if (businessId) {
        socket.join(`business:${businessId}`)
        console.log(`[Socket] ${socket.id} subscribed to business:${businessId}`)
      }
    })

    socket.on('unsubscribe:business', (businessId) => {
      if (businessId) {
        socket.leave(`business:${businessId}`)
      }
    })

    socket.on('subscribe:applications', () => {
      // Only staff can subscribe to all applications
      if (['lgu_officer', 'lgu_manager', 'staff', 'admin'].includes(userRole)) {
        socket.join('applications:all')
        console.log(`[Socket] ${socket.id} subscribed to applications:all`)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}`, { reason })
      
      if (userId && connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id)
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId)
        }
      }
    })

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })

  console.log('[Socket] Socket.io server initialized')
  return io
}

/**
 * Get the Socket.io server instance
 */
function getIO() {
  if (!io) {
    console.warn('[Socket] Socket.io not initialized. Call initializeSocket first.')
  }
  return io
}

/**
 * Emit event to a specific user (all their connected devices)
 */
function emitToUser(userId, event, data) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}

/**
 * Emit event to users with a specific role
 */
function emitToRole(role, event, data) {
  if (!io) return
  io.to(`role:${role}`).emit(event, data)
}

/**
 * Emit event to all staff (officers, managers, admins)
 */
function emitToStaff(event, data) {
  if (!io) return
  io.to('role:staff').emit(event, data)
}

/**
 * Emit event related to a specific business
 */
function emitToBusiness(businessId, event, data) {
  if (!io) return
  io.to(`business:${businessId}`).emit(event, data)
}

/**
 * Emit to all subscribers of the applications feed
 */
function emitToApplicationsSubscribers(event, data) {
  if (!io) return
  io.to('applications:all').emit(event, data)
}

/**
 * Broadcast to all connected clients
 */
function broadcast(event, data) {
  if (!io) return
  io.emit(event, data)
}

/**
 * Check if a user is currently connected
 */
function isUserConnected(userId) {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0
}

/**
 * Get count of connected users
 */
function getConnectedUsersCount() {
  return connectedUsers.size
}

// ─── Application Events ────────────────────────────────────────────────────────

/**
 * Emit when a new application is created/submitted
 */
function emitApplicationCreated(application, ownerId) {
  const payload = {
    type: 'application:created',
    application: sanitizeApplication(application),
    timestamp: new Date().toISOString(),
  }
  
  // Notify the owner
  if (ownerId) {
    emitToUser(ownerId, 'application:created', payload)
  }
  
  // Notify all staff watching applications
  emitToApplicationsSubscribers('application:created', payload)
  emitToStaff('application:created', payload)
}

/**
 * Emit when an application status changes
 */
function emitApplicationUpdated(application, ownerId, changedFields = {}) {
  const payload = {
    type: 'application:updated',
    application: sanitizeApplication(application),
    changedFields,
    timestamp: new Date().toISOString(),
  }
  
  // Notify the owner
  if (ownerId) {
    emitToUser(ownerId, 'application:updated', payload)
  }
  
  // Notify subscribers of this specific business
  const businessId = application.businessId || application._id
  if (businessId) {
    emitToBusiness(businessId, 'application:updated', payload)
  }
  
  // Notify all staff watching applications
  emitToApplicationsSubscribers('application:updated', payload)
}

/**
 * Emit when an application is claimed by an officer
 */
function emitApplicationClaimed(application, claimedBy) {
  const payload = {
    type: 'application:claimed',
    application: sanitizeApplication(application),
    claimedBy,
    timestamp: new Date().toISOString(),
  }
  
  emitToApplicationsSubscribers('application:claimed', payload)
  emitToStaff('application:claimed', payload)
}

/**
 * Emit when an application is released by an officer
 */
function emitApplicationReleased(application, releasedBy) {
  const payload = {
    type: 'application:released',
    application: sanitizeApplication(application),
    releasedBy,
    timestamp: new Date().toISOString(),
  }
  
  emitToApplicationsSubscribers('application:released', payload)
  emitToStaff('application:released', payload)
}

// ─── Payment Events ────────────────────────────────────────────────────────────

/**
 * Emit when a payment is created
 */
function emitPaymentCreated(payment, ownerId, businessId) {
  const payload = {
    type: 'payment:created',
    payment: sanitizePayment(payment),
    timestamp: new Date().toISOString(),
  }
  
  if (ownerId) {
    emitToUser(ownerId, 'payment:created', payload)
  }
  
  if (businessId) {
    emitToBusiness(businessId, 'payment:created', payload)
  }
}

/**
 * Emit when a payment is verified
 */
function emitPaymentVerified(payment, ownerId, businessId) {
  const payload = {
    type: 'payment:verified',
    payment: sanitizePayment(payment),
    timestamp: new Date().toISOString(),
  }
  
  if (ownerId) {
    emitToUser(ownerId, 'payment:verified', payload)
  }
  
  if (businessId) {
    emitToBusiness(businessId, 'payment:verified', payload)
  }
  
  emitToStaff('payment:verified', payload)
}

// ─── Inspection Events ─────────────────────────────────────────────────────────

/**
 * Emit when an inspection is scheduled
 */
function emitInspectionScheduled(inspection, ownerId, businessId) {
  const payload = {
    type: 'inspection:scheduled',
    inspection: sanitizeInspection(inspection),
    timestamp: new Date().toISOString(),
  }
  
  if (ownerId) {
    emitToUser(ownerId, 'inspection:scheduled', payload)
  }
  
  if (businessId) {
    emitToBusiness(businessId, 'inspection:scheduled', payload)
  }
}

/**
 * Emit when an inspection is completed
 */
function emitInspectionCompleted(inspection, ownerId, businessId) {
  const payload = {
    type: 'inspection:completed',
    inspection: sanitizeInspection(inspection),
    timestamp: new Date().toISOString(),
  }
  
  if (ownerId) {
    emitToUser(ownerId, 'inspection:completed', payload)
  }
  
  if (businessId) {
    emitToBusiness(businessId, 'inspection:completed', payload)
  }
  
  emitToStaff('inspection:completed', payload)
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sanitize application data for socket transmission (remove sensitive fields)
 */
function sanitizeApplication(app) {
  if (!app) return null
  
  const sanitized = typeof app.toObject === 'function' ? app.toObject() : { ...app }
  
  // Remove potentially sensitive nested data
  delete sanitized.formData
  delete sanitized.lguDocuments
  delete sanitized.documentCids
  
  return {
    _id: sanitized._id,
    businessId: sanitized.businessId,
    businessName: sanitized.businessName,
    applicationStatus: sanitized.applicationStatus,
    applicationType: sanitized.applicationType,
    formType: sanitized.formType,
    category: sanitized.category,
    claimedBy: sanitized.claimedBy,
    reviewedBy: sanitized.reviewedBy,
    submittedAt: sanitized.submittedAt,
    updatedAt: sanitized.updatedAt,
    applicationReferenceNumber: sanitized.applicationReferenceNumber,
  }
}

/**
 * Sanitize payment data for socket transmission
 */
function sanitizePayment(payment) {
  if (!payment) return null
  
  const sanitized = typeof payment.toObject === 'function' ? payment.toObject() : { ...payment }
  
  return {
    _id: sanitized._id,
    businessId: sanitized.businessId,
    amount: sanitized.amount,
    status: sanitized.status,
    paymentType: sanitized.paymentType,
    referenceNumber: sanitized.referenceNumber,
    createdAt: sanitized.createdAt,
    verifiedAt: sanitized.verifiedAt,
  }
}

/**
 * Sanitize inspection data for socket transmission
 */
function sanitizeInspection(inspection) {
  if (!inspection) return null
  
  const sanitized = typeof inspection.toObject === 'function' ? inspection.toObject() : { ...inspection }
  
  return {
    _id: sanitized._id,
    businessId: sanitized.businessId,
    status: sanitized.status,
    scheduledDate: sanitized.scheduledDate,
    completedAt: sanitized.completedAt,
    result: sanitized.result,
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToStaff,
  emitToBusiness,
  emitToApplicationsSubscribers,
  broadcast,
  isUserConnected,
  getConnectedUsersCount,
  // Application events
  emitApplicationCreated,
  emitApplicationUpdated,
  emitApplicationClaimed,
  emitApplicationReleased,
  // Payment events
  emitPaymentCreated,
  emitPaymentVerified,
  // Inspection events
  emitInspectionScheduled,
  emitInspectionCompleted,
}
