import { useCallback } from 'react'
import { App } from 'antd'
import { deleteBusiness } from '../../../services/businessProfileService'
import { isDraftStatus } from '../utils/statusUtils'

export function useBusinessActions({
  businesses,
  dashboardState,
  setEditingApplication,
  fetchBusinesses,
  selectedBusinessId,
}) {
  const { message } = App.useApp()

  const handleBusinessSelect = useCallback((businessId) => {
    const application = businesses.find(b => (b.businessId || b._id) === businessId)
    if (application) {
      const appStatus = application.applicationStatus || application.permitStatus || ''
      if (isDraftStatus(appStatus)) {
        // Clear selected business ID when opening draft for editing
        dashboardState.setSelectedBusinessId(null)
        dashboardState.openEditApplicationForm(application)
      } else {
        // Clear form state when selecting non-draft application
        dashboardState.setShowAddForm(false)
        dashboardState.setEditingApplication(null)
        dashboardState.selectBusiness(businessId)
      }
    }
  }, [businesses, dashboardState])

  const handleAddBusiness = useCallback(() => {
    // Count draft, pending, and submitted applications
    const draftOrPendingCount = businesses.filter(
      b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
    ).length

    if (draftOrPendingCount >= 2) {
      message.warning('You can only have up to 2 draft, pending, or submitted applications at a time. Please complete or delete existing applications before creating a new one.')
      return
    }

    dashboardState.setShowBusinessTypeSelector(true)
    dashboardState.setSelectedBusinessId(null)
    dashboardState.setShowAddForm(false)
    setEditingApplication(null)
  }, [dashboardState, setEditingApplication, businesses, message])

  // Calculate draft limit status for UI
  const draftLimitReached = businesses.filter(
    b => b.applicationStatus === 'draft' || b.applicationStatus === 'pending' || b.applicationStatus === 'submitted'
  ).length >= 2

  const handleBusinessTypeSelect = useCallback((registrationType) => {
    dashboardState.openApplicationForm({ registrationType, fromWelcome: false })
    dashboardState.setShowBusinessTypeSelector(false)
  }, [dashboardState])

  const handleDeleteApplication = useCallback(async (business) => {
    const businessId = business.businessId || business._id
    try {
      await deleteBusiness(businessId)
      message.success('Application deleted.')
      localStorage.removeItem('addBusinessFormDraft')
      if (selectedBusinessId === businessId) {
        dashboardState.setSelectedBusinessId(null)
        dashboardState.setShowAddForm(false)
        setEditingApplication(null)
      }
      fetchBusinesses()
    } catch (err) {
      console.error('Failed to delete application:', err)
      message.error(err?.message || 'Failed to delete application')
    }
  }, [selectedBusinessId, dashboardState, setEditingApplication, fetchBusinesses, message])

  const handleDeleteDraftClick = useCallback(() => {
    const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
    if (!selectedBusiness) return
    message.confirm({
      title: 'Delete draft application?',
      content: 'This will permanently remove this draft. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDeleteApplication(selectedBusiness),
    })
  }, [businesses, selectedBusinessId, message, handleDeleteApplication])

  return {
    handleBusinessSelect,
    handleAddBusiness,
    handleBusinessTypeSelect,
    handleDeleteApplication,
    handleDeleteDraftClick,
    draftLimitReached,
  }
}
