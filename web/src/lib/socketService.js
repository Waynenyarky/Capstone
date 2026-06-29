/**
 * Socket.io client service for realtime updates
 */

import { io } from 'socket.io-client'

let socket = null
let socketToken = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Initialize socket connection
 * @param {string} token - JWT token for authentication
 */
export function initializeSocket(token) {
  // Check if socket is disabled via environment variable
  if (import.meta.env.VITE_DISABLE_SOCKET === 'true') {
    console.log('[socketService] Socket disabled via VITE_DISABLE_SOCKET')
    return null
  }

  // Reuse an existing socket when initialize is called repeatedly with the same token
  // (common in React StrictMode remounts and shared hooks)
  if (socket && socketToken === token) {
    if (socket.connected || socket.active || !socket.disconnected) {
      return socket
    }

    // Stale/disconnected instance with same token: attempt reconnect first
    try {
      socket.connect()
      return socket
    } catch {
      // If reconnect throws, recreate below
    }
  }

  // Token changed or stale socket: disconnect and recreate
  if (socket) {
    socket.disconnect()
    socket = null
  }

  // Determine the socket URL based on environment
  const socketUrl = import.meta.env.VITE_SOCKET_URL ||
                    import.meta.env.VITE_BUSINESS_API_URL ||
                    'http://localhost:3002'

  // Only connect if we have a valid socket URL (not default localhost in production)
  if (!socketUrl || socketUrl === 'http://localhost:3002') {
    console.log('[socketService] No valid socket URL configured, skipping socket connection')
    return null
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    // Suppress console errors when socket server is not available
    forceNew: false,
  })
  socketToken = token

  socket.on('connect', () => {
    reconnectAttempts = 0
  })

  socket.on('disconnect', (_reason) => {
    // Silent disconnect
  })

  socket.on('connect_error', (_error) => {
    reconnectAttempts++
  })

  socket.on('pong', (_data) => {
    // Silent pong
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
    socketToken = null
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
