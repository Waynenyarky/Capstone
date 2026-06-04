/**
 * Hook to manage page refresh state and socket connection status
 * Provides a centralized way to handle refresh functionality across all pages
 */

import { useState, useCallback, useEffect } from 'react'
import { useSocketConnection } from './useSocket'

export function usePageRefresh({ onRefresh: customOnRefresh } = {}) {
  const { connected } = useSocketConnection()
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (customOnRefresh) {
        await customOnRefresh()
      }
      setLastUpdated(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [customOnRefresh])

  const markUpdated = useCallback(() => {
    setLastUpdated(new Date())
  }, [])

  // Update lastUpdated when socket connects to show "Live" status
  useEffect(() => {
    if (connected) {
      setLastUpdated(new Date())
    }
  }, [connected])

  return {
    onRefresh: handleRefresh,
    lastUpdated,
    socketConnected: connected,
    refreshing,
    markUpdated,
  }
}

export default usePageRefresh
