import { useEffect, useRef, useCallback } from 'react'
import { getNotificationStreamToken } from '../services/notificationService'
import { getApiOriginForPath } from '@/lib/http'

const RETRY_DELAYS_MS = [2000, 5000, 10000]
const MAX_RETRIES = 3

/**
 * Subscribe to real-time notification stream (SSE). When a new notification is pushed,
 * calls onNewNotification. Keeps 30s polling as fallback when SSE is unavailable.
 * Does not retry on 401/403 (getStreamToken will fail after logout).
 *
 * @param {object} options
 * @param {boolean} options.enabled - Whether to open the stream (e.g. user is logged in and notifications not hidden)
 * @param {function} options.onNewNotification - Callback when a new notification event is received (e.g. refetch list)
 */
export function useNotificationStream({ enabled, onNewNotification }) {
  const eventSourceRef = useRef(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef(null)
  const onNewRef = useRef(onNewNotification)
  onNewRef.current = onNewNotification

  const connect = useCallback(() => {
    if (!enabled) return
    getNotificationStreamToken()
      .then((data) => {
        if (!data?.streamToken) return
        const base = getApiOriginForPath('/api/notifications/stream')
        const path = '/api/notifications/stream'
        const url = base ? `${base}${path}?token=${encodeURIComponent(data.streamToken)}` : `${path}?token=${encodeURIComponent(data.streamToken)}`
        const es = new EventSource(url)
        eventSourceRef.current = es
        retryCountRef.current = 0

        es.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data)
            if (payload.type === 'new' && payload.notification && onNewRef.current) {
              onNewRef.current(payload.notification)
            }
          } catch (_) { /* ignore parse errors */ }
        }

        es.onerror = () => {
          es.close()
          eventSourceRef.current = null
          if (!enabled) return
          const idx = Math.min(retryCountRef.current, RETRY_DELAYS_MS.length - 1)
          const delay = RETRY_DELAYS_MS[idx]
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1
            retryTimeoutRef.current = setTimeout(connect, delay)
          }
        }
      })
      .catch((err) => {
        const status = err?.response?.status ?? err?.status
        if (status === 401 || status === 403) return
        if (!enabled) return
        const idx = Math.min(retryCountRef.current, RETRY_DELAYS_MS.length - 1)
        const delay = RETRY_DELAYS_MS[idx]
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1
          retryTimeoutRef.current = setTimeout(connect, delay)
        }
      })
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    connect()
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [enabled, connect])
}
