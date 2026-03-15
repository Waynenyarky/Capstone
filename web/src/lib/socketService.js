/**
 * Socket.io client service for realtime updates
 */

import { io } from 'socket.io-client'

let socket = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Initialize socket connection
 * @param {string} token - JWT token for authentication
 */
export function initializeSocket(token) {
  // If already connected with same token, return existing socket
  if (socket?.connected) {
    console.log('[Socket] Already connected:', socket.id)
    return socket
  }

  // If socket exists but not connected, disconnect and recreate
  if (socket) {
    console.log('[Socket] Reconnecting with new token...')
    socket.disconnect()
    socket = null
  }

  // Determine the socket URL based on environment
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                    import.meta.env.VITE_BUSINESS_API_URL || 
                    'http://localhost:3002'

  console.log('[Socket] Connecting to:', socketUrl)

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
    reconnectAttempts = 0
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message)
    reconnectAttempts++
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Socket] Max reconnection attempts reached')
    }
  })

  socket.on('pong', (data) => {
    console.log('[Socket] Pong received:', data)
  })

  return socket
}

/**
 * Get the current socket instance
 */
export function getSocket() {
  return socket
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    reconnectAttempts = 0
  }
}

/**
 * Subscribe to application updates (for staff)
 */
export function subscribeToApplications() {
  if (socket?.connected) {
    socket.emit('subscribe:applications')
  }
}

/**
 * Subscribe to a specific business's updates
 */
export function subscribeToBusiness(businessId) {
  if (socket?.connected && businessId) {
    socket.emit('subscribe:business', businessId)
  }
}

/**
 * Unsubscribe from a specific business's updates
 */
export function unsubscribeFromBusiness(businessId) {
  if (socket?.connected && businessId) {
    socket.emit('unsubscribe:business', businessId)
  }
}

/**
 * Send a ping to check connection health
 */
export function ping() {
  if (socket?.connected) {
    socket.emit('ping')
  }
}

/**
 * Check if socket is connected
 */
export function isConnected() {
  return socket?.connected ?? false
}

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  subscribeToApplications,
  subscribeToBusiness,
  unsubscribeFromBusiness,
  ping,
  isConnected,
}
