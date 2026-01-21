import { useEffect, useState } from 'react'
import { getMaintenanceStatus } from '@/features/public/services/maintenanceService.js'

export function useMaintenanceStatus() {
  const [status, setStatus] = useState({ loading: true, active: false })

  useEffect(() => {
    let mounted = true
    let intervalId = null

    const fetchStatus = () => {
      getMaintenanceStatus()
        .then((res) => {
          if (!mounted) return
          setStatus({
            loading: false,
            active: !!res?.active,
            message: res?.message,
            expectedResumeAt: res?.expectedResumeAt,
          })
        })
        .catch(() => {
          if (!mounted) return
          setStatus({ loading: false, active: false })
        })
    }

    fetchStatus()
    intervalId = window.setInterval(fetchStatus, 30000)

    return () => {
      mounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  return status
}
