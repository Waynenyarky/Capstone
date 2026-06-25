import { createContext, useContext, useCallback } from 'react'
import { App } from 'antd'
import { useSocketConnection, useApplicationEvents } from '@/hooks/useSocket'

const OfficerRealtimeContext = createContext(null)

export function OfficerRealtimeProvider({ children }) {
  const { message } = App.useApp()
  const { connected: socketConnected } = useSocketConnection()

  const handleApplicationCreated = useCallback((data) => {
    console.log('[Realtime] New application:', data)
    message.info(`New application submitted: ${data.application?.businessName || 'Unknown'}`)
  }, [message])

  const handleApplicationUpdated = useCallback((data) => {
    console.log('[Realtime] Application updated:', data)
  }, [])

  const handleApplicationClaimed = useCallback((data) => {
    console.log('[Realtime] Application claimed:', data)
  }, [])

  const handleApplicationReleased = useCallback((data) => {
    console.log('[Realtime] Application released:', data)
  }, [])

  useApplicationEvents({
    onApplicationCreated: handleApplicationCreated,
    onApplicationUpdated: handleApplicationUpdated,
    onApplicationClaimed: handleApplicationClaimed,
    onApplicationReleased: handleApplicationReleased,
  })

  const value = {
    socketConnected,
  }

  return (
    <OfficerRealtimeContext.Provider value={value}>
      {children}
    </OfficerRealtimeContext.Provider>
  )
}

export function useOfficerRealtime() {
  const context = useContext(OfficerRealtimeContext)
  if (!context) {
    throw new Error('useOfficerRealtime must be used within OfficerRealtimeProvider')
  }
  return context
}
