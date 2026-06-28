import { createContext, useContext, useState, useCallback } from 'react'

const OfficerDataContext = createContext(null)

export function OfficerDataProvider({ children }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const value = {
    refreshTrigger,
    refresh,
  }

  return (
    <OfficerDataContext.Provider value={value}>
      {children}
    </OfficerDataContext.Provider>
  )
}

export function useOfficerDataContext() {
  const context = useContext(OfficerDataContext)
  if (!context) {
    throw new Error('useOfficerDataContext must be used within OfficerDataProvider')
  }
  return context
}
