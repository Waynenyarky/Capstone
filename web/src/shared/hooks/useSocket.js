/**
 * React hook for Socket.io realtime updates
 */

import { useEffect, useRef, useState } from 'react'
import { useAuthSession } from '@/features/authentication/hooks/useAuthSession'
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  subscribeToApplications,
  subscribeToBusiness,
  unsubscribeFromBusiness,
} from '@/lib/socketService'

/**
 * Hook to manage socket connection lifecycle
 * Automatically connects when user is authenticated and disconnects on logout
 */
export function useSocketConnection() {
  const { currentUser } = useAuthSession()
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // Get token from currentUser
    const token = currentUser?.token

    if (!token) {
      setConnected(false)
      return
    }

    // Initialize socket connection
    const socket = initializeSocket(token)
    socketRef.current = socket

    if (!socket) {
      setConnected(false)
      return
    }

    const handleConnect = () => {
      setConnected(true)
    }
    const handleDisconnect = (_reason) => {
      setConnected(false)
    }
    const handleConnectError = (_error) => {
      setConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    // Set initial state based on current connection status
    setConnected(socket.connected)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
    }
  }, [currentUser?.token])

  // Disconnect on logout
  useEffect(() => {
    if (!currentUser && socketRef.current) {
      console.log('[useSocketConnection] User logged out, disconnecting socket')
      disconnectSocket()
      socketRef.current = null
      setConnected(false)
    }
  }, [currentUser])

  return { connected, isConnected: connected }
}

/**
 * Hook to subscribe to application events (for LGU officers/staff)
 * @param {Object} options
 * @param {Function} options.onApplicationCreated - Called when new application is submitted
 * @param {Function} options.onApplicationUpdated - Called when application status changes
 * @param {Function} options.onApplicationClaimed - Called when application is claimed
 * @param {Function} options.onApplicationReleased - Called when application is released
 */
export function useApplicationEvents({
  onApplicationCreated,
  onApplicationUpdated,
  onApplicationClaimed,
  onApplicationReleased,
} = {}) {
  const subscribedRef = useRef(false)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    // Subscribe to applications feed
    if (!subscribedRef.current && socket.connected) {
      subscribeToApplications()
      subscribedRef.current = true
    }

    const handleConnect = () => {
      if (!subscribedRef.current) {
        subscribeToApplications()
        subscribedRef.current = true
      }
    }

    socket.on('connect', handleConnect)

    // Set up event listeners
    if (onApplicationCreated) {
      socket.on('application:created', onApplicationCreated)
    }
    if (onApplicationUpdated) {
      socket.on('application:updated', onApplicationUpdated)
    }
    if (onApplicationClaimed) {
      socket.on('application:claimed', onApplicationClaimed)
    }
    if (onApplicationReleased) {
      socket.on('application:released', onApplicationReleased)
    }

    return () => {
      socket.off('connect', handleConnect)
      if (onApplicationCreated) socket.off('application:created', onApplicationCreated)
      if (onApplicationUpdated) socket.off('application:updated', onApplicationUpdated)
      if (onApplicationClaimed) socket.off('application:claimed', onApplicationClaimed)
      if (onApplicationReleased) socket.off('application:released', onApplicationReleased)
    }
  }, [onApplicationCreated, onApplicationUpdated, onApplicationClaimed, onApplicationReleased])
}

/**
 * Hook to subscribe to a specific business's events (for business owners)
 * @param {string} businessId - The business ID to subscribe to
 * @param {Object} options
 * @param {Function} options.onApplicationUpdated - Called when application status changes
 * @param {Function} options.onPaymentCreated - Called when payment is created
 * @param {Function} options.onPaymentVerified - Called when payment is verified
 * @param {Function} options.onInspectionScheduled - Called when inspection is scheduled
 * @param {Function} options.onInspectionCompleted - Called when inspection is completed
 */
export function useBusinessEvents(businessId, {
  onApplicationUpdated,
  onPaymentCreated,
  onPaymentVerified,
  onInspectionScheduled,
  onInspectionCompleted,
} = {}) {
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !businessId) return

    // Subscribe to this business's updates
    if (socket.connected) {
      subscribeToBusiness(businessId)
    }

    const handleConnect = () => {
      subscribeToBusiness(businessId)
    }

    socket.on('connect', handleConnect)

    // Set up event listeners
    if (onApplicationUpdated) {
      socket.on('application:updated', onApplicationUpdated)
    }
    if (onPaymentCreated) {
      socket.on('payment:created', onPaymentCreated)
    }
    if (onPaymentVerified) {
      socket.on('payment:verified', onPaymentVerified)
    }
    if (onInspectionScheduled) {
      socket.on('inspection:scheduled', onInspectionScheduled)
    }
    if (onInspectionCompleted) {
      socket.on('inspection:completed', onInspectionCompleted)
    }

    return () => {
      socket.off('connect', handleConnect)
      unsubscribeFromBusiness(businessId)
      if (onApplicationUpdated) socket.off('application:updated', onApplicationUpdated)
      if (onPaymentCreated) socket.off('payment:created', onPaymentCreated)
      if (onPaymentVerified) socket.off('payment:verified', onPaymentVerified)
      if (onInspectionScheduled) socket.off('inspection:scheduled', onInspectionScheduled)
      if (onInspectionCompleted) socket.off('inspection:completed', onInspectionCompleted)
    }
  }, [businessId, onApplicationUpdated, onPaymentCreated, onPaymentVerified, onInspectionScheduled, onInspectionCompleted])
}

/**
 * Hook to listen for any socket event
 * @param {string} event - Event name to listen for
 * @param {Function} handler - Event handler
 */
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !event) return

    const wrappedHandler = (data) => {
      handlerRef.current?.(data)
    }

    socket.on(event, wrappedHandler)

    return () => {
      socket.off(event, wrappedHandler)
    }
  }, [event])
}

export default {
  useSocketConnection,
  useApplicationEvents,
  useBusinessEvents,
  useSocketEvent,
}
