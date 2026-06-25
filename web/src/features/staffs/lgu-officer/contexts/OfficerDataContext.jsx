import { createContext, useContext, useState, useCallback } from 'react'

const OfficerDataContext = createContext(null)

export function OfficerDataProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    setLastUpdated(new Date())
  }, [])

  const handleItemSelect = useCallback((item) => {
    setSelectedItem(item)
  }, [])

  const handleReviewComplete = useCallback(() => {
    refresh()
  }, [refresh])

  const value = {
    selectedItem,
    setSelectedItem,
    refreshTrigger,
    setRefreshTrigger,
    lastUpdated,
    setLastUpdated,
    refresh,
    handleItemSelect,
    handleReviewComplete,
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
