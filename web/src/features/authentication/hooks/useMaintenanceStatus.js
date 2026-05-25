import { useEffect, useState } from 'react'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'

const POLL_INTERVAL_MS = 30000
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000
let sharedStatus = { loading: true, active: false }
let sharedPromise = null
let sharedIntervalId = null
let failureRetryAfter = 0
const listeners = new Set()

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(sharedStatus)
    } catch {
      // Ignore listener failures so one consumer cannot break the shared poller.
    }
  }
}

async function refreshStatus() {
  if (sharedPromise) return sharedPromise
  if (Date.now() < failureRetryAfter) return sharedStatus

  sharedPromise = getMaintenanceStatus()
    .then((res) => {
      sharedStatus = {
        loading: false,
        active: !!res?.active,
        message: res?.message,
        expectedResumeAt: res?.expectedResumeAt,
      }
      failureRetryAfter = 0
      notifyListeners()
      return sharedStatus
    })
    .catch(() => {
      sharedStatus = { loading: false, active: false }
      failureRetryAfter = Date.now() + FAILURE_COOLDOWN_MS
      notifyListeners()
      return sharedStatus
    })
    .finally(() => {
      sharedPromise = null
    })

  return sharedPromise
}

export function useMaintenanceStatus({ enabled = true } = {}) {
  const [status, setStatus] = useState(sharedStatus)

  useEffect(() => {
    if (!enabled) {
      setStatus({ loading: false, active: false })
      return () => {}
    }

    let mounted = true
    const listener = (nextStatus) => {
      if (!mounted) return
      setStatus(nextStatus)
    }

    listeners.add(listener)
    setStatus(sharedStatus)
    refreshStatus()

    if (!sharedIntervalId) {
      sharedIntervalId = window.setInterval(() => {
        refreshStatus()
      }, POLL_INTERVAL_MS)
    }

    return () => {
      mounted = false
      listeners.delete(listener)
      if (listeners.size === 0 && sharedIntervalId) {
        window.clearInterval(sharedIntervalId)
        sharedIntervalId = null
      }
    }
  }, [enabled])

  return status
}
