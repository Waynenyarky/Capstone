import { useState, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import StaffLayout from '../../components/StaffLayout'
import useOfficerData from '../hooks/useOfficerData'
import { useSocketConnection, useApplicationEvents } from '@/hooks/useSocket'

export default function OfficerPageWrapper({ children, activeTab }) {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Socket connection for realtime updates
  const { connected: socketConnected } = useSocketConnection()

  // Use the data hook
  const officerData = useOfficerData(activeTab, refreshTrigger)

  // Listen for realtime application events
  useApplicationEvents({
    onApplicationCreated: useCallback((data) => {
      console.log('[Realtime] New application:', data)
      message.info(`New application submitted: ${data.application?.businessName || 'Unknown'}`)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, [message]),
    onApplicationUpdated: useCallback((data) => {
      console.log('[Realtime] Application updated:', data)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, []),
    onApplicationClaimed: useCallback((data) => {
      console.log('[Realtime] Application claimed:', data)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, []),
    onApplicationReleased: useCallback((data) => {
      console.log('[Realtime] Application released:', data)
      setRefreshTrigger(prev => prev + 1)
      setLastUpdated(new Date())
    }, []),
  })

  // Set initial last updated time when data loads
  useEffect(() => {
    if (officerData.counts && !lastUpdated) {
      setLastUpdated(new Date())
    }
  }, [officerData.counts, lastUpdated])

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    setLastUpdated(new Date())
  }, [])

  const handleReviewComplete = useCallback(() => {
    officerData.refreshToReview?.()
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
    refresh()
  }, [officerData, refresh])

  const handleClaimChange = useCallback(() => {
    officerData.refreshToReview?.()
    officerData.refreshApplicationTabs?.()
    officerData.refresh?.()
    refresh()
  }, [officerData, refresh])

  const handleItemSelect = useCallback((_item) => {
    // This is handled by individual page components
  }, [])

  const onCreateWalkIn = useCallback(() => {
    navigate('/staff/drafts')
  }, [navigate])

  const onRegisterOwner = useCallback(() => {
    // TODO: Implement owner registration modal
  }, [])

  return (
    <StaffLayout
      hideSidebar={false}
      _noContentWrap
      onRefresh={refresh}
      lastUpdated={lastUpdated}
      socketConnected={socketConnected}
      loading={officerData.isLoading}
    >
      {children({
        officerData,
        onReviewComplete: handleReviewComplete,
        onClaimChange: handleClaimChange,
        onItemSelect: handleItemSelect,
        onCreateWalkIn,
        onRegisterOwner,
        refresh,
      })}
    </StaffLayout>
  )
}
