import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Typography, Spin, theme, Space, Empty, Button, App, Tag, Pagination, Input, Select, Card, Modal, Tabs, Badge } from 'antd'
import { PlusOutlined, ReloadOutlined, ShopOutlined, ArrowLeftOutlined, BugOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, SettingOutlined, LogoutOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import BusinessListPanel from '../components/dashboard/BusinessListPanel'
import BusinessCard from '../components/BusinessCard'
import AddBusinessForm from '../components/AddBusinessForm'
import PendingApplicationView from '../components/PendingApplicationView'
import ApprovedBusinessView from '../components/ApprovedBusinessView'
import UserSettingsView from '@/features/user/pages/profileSettings/UserSettingsView'
import WelcomeModal from '../components/onboarding/WelcomeModal'
import { useAuthSession } from '@/features/authentication'
import { useThemeSettings } from '@/features/user/hooks/useThemeSettings'
import { getBusinesses, getBusinessesPaginated, updateBusiness, deleteBusiness } from '../services/businessProfileService'
import { useSocketConnection, useSocketEvent } from '@/hooks/useSocket'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const getStatusLabel = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'submitted') return 'Pending Review'
  if (statusLower === 'under_review') return 'Under Review'
  if (statusLower === 'pending_renewal') return 'For Renewal'
  if (statusLower === 'approved') return 'Active'
  if (statusLower === 'needs_revision') return 'Action Required'
  if (statusLower === 'resubmit') return 'Resubmitted'
  if (statusLower === 'rejected') return 'Rejected'
  if (statusLower === 'draft') return 'Draft'
  return status || 'Unknown'
}

const getStatusTagColor = (status) => {
  const statusLower = (status || '').toLowerCase()
  if (statusLower === 'active' || statusLower === 'approved') return 'success'
  if (statusLower === 'for renewal' || statusLower.includes('renewal')) return 'warning'
  if (statusLower === 'pending' || statusLower.includes('pending') || statusLower.includes('review') || statusLower === 'submitted') return 'processing'
  if (statusLower === 'expired' || statusLower === 'rejected') return 'error'
  if (statusLower === 'needs_revision' || statusLower === 'resubmit') return 'warning'
  if (statusLower === 'draft') return 'default'
  return 'default'
}

export default function BusinessOwnerDashboard() {
  const { token } = theme.useToken()
  const { message, modal } = App.useApp()
  const { currentUser, roleSlug, isLoading: authLoading } = useAuthSession()
  const themeSettings = useThemeSettings(message)
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showProgressView, setShowProgressView] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false) // Settings view state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [hasClosedWelcomeModal, setHasClosedWelcomeModal] = useState(false) // Track if user explicitly closed modal
  const [businessType, setBusinessType] = useState('general') // 'general' or 'healthcare'
  const [fromWelcomeModal, setFromWelcomeModal] = useState(false) // Track if coming from welcome modal
  const formRef = useRef(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  
  // Enhanced pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [paginationLoading, setPaginationLoading] = useState(false)

  // Socket connection for realtime updates
  const { connected: socketConnected } = useSocketConnection()

  // Listen for application status updates
  useSocketEvent('application:updated', useCallback((data) => {
    console.log('[Realtime] Application updated:', data)
    const updatedApp = data.application
    if (!updatedApp) return
    
    // Update the business in state if it matches
    setBusinesses(prev => prev.map(b => {
      if ((b.businessId || b._id) === updatedApp.businessId || (b.businessId || b._id) === updatedApp._id) {
        return { ...b, ...updatedApp }
      }
      return b
    }))
    
    // Update editingBusiness if it's the one that changed
    if (editingBusiness && ((editingBusiness.businessId || editingBusiness._id) === updatedApp.businessId || (editingBusiness.businessId || editingBusiness._id) === updatedApp._id)) {
      setEditingBusiness(prev => prev ? { ...prev, ...updatedApp } : prev)
    }
    
    // Show notification for status changes
    if (updatedApp.applicationStatus) {
      const statusLabel = getStatusLabel(updatedApp.applicationStatus)
      message.info(`${updatedApp.businessName || 'Your application'} status: ${statusLabel}`)
    }
    
    setLastUpdatedAt(new Date())
  }, [editingBusiness, message]))

  // Listen for payment events
  useSocketEvent('payment:verified', useCallback((data) => {
    console.log('[Realtime] Payment verified:', data)
    message.success('Payment has been verified!')
    // Refresh to get updated status
    fetchBusinessesRef.current?.(false)
    setLastUpdatedAt(new Date())
  }, [message]))

  // Listen for inspection events
  useSocketEvent('inspection:scheduled', useCallback((data) => {
    console.log('[Realtime] Inspection scheduled:', data)
    message.info('An inspection has been scheduled for your business')
    setLastUpdatedAt(new Date())
  }, [message]))

  useSocketEvent('inspection:completed', useCallback((data) => {
    console.log('[Realtime] Inspection completed:', data)
    message.info('Inspection completed - check your application for results')
    fetchBusinessesRef.current?.(false)
    setLastUpdatedAt(new Date())
  }, [message]))

  // Ref to access fetchBusinesses in socket callbacks
  const fetchBusinessesRef = useRef(null)

  const fetchBusinesses = useCallback(async (resetPage = false) => {
    if (resetPage) {
      setCurrentPage(1)
    }
    
    setLoading(true)
    try {
      // Use paginated API for better performance with large datasets
      const result = await getBusinessesPaginated({
        page: resetPage ? 1 : currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        sort: sortBy,
        order: sortOrder
      })
      
      setBusinesses(result.businesses || [])
      setTotalItems(result.pagination?.totalItems || 0)
      setLastUpdatedAt(new Date())
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      message.error('Failed to load businesses')
      // Fallback to non-paginated API
      try {
        const data = await getBusinesses()
        setBusinesses(data || [])
        setTotalItems(data?.length || 0)
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr)
      }
    } finally {
      setLoading(false)
      setPaginationLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBusinessesPaginated = useCallback(async () => {
    setPaginationLoading(true)
    await fetchBusinesses()
  }, [fetchBusinesses])

  // Keep fetchBusinessesRef updated for socket callbacks
  useEffect(() => {
    fetchBusinessesRef.current = fetchBusinesses
  }, [fetchBusinesses])

  // Initial fetch - only run once when user is authenticated
  const initialFetchDone = useRef(false)
  useEffect(() => {
    if (currentUser && roleSlug === 'business_owner' && !initialFetchDone.current) {
      initialFetchDone.current = true
      fetchBusinesses()
    }
  }, [currentUser, roleSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when pagination/filter params change (but not on initial mount)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (currentUser && roleSlug === 'business_owner') {
      fetchBusinesses()
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show welcome modal for new users (empty businesses list)
  // But don't show if user has explicitly closed it
  useEffect(() => {
    if (!loading && businesses.length === 0 && !showAddForm && !showWelcomeModal && !hasClosedWelcomeModal) {
      setShowWelcomeModal(true)
    }
  }, [businesses.length, loading, showAddForm, showWelcomeModal, hasClosedWelcomeModal])

  const selectedBusiness = businesses.find(b => (b.businessId || b._id) === selectedBusinessId)
  const appStatus = (selectedBusiness?.applicationStatus || selectedBusiness?.permitStatus || '').toLowerCase()
  const isDraft = selectedBusiness && appStatus === 'draft'
  const isApproved = selectedBusiness && appStatus === 'approved'
  const isNeedsRevision = selectedBusiness && appStatus === 'needs_revision'
  const isResubmitted = selectedBusiness && appStatus === 'resubmit'
  const canEditRevision = Boolean(selectedBusiness && appStatus === 'needs_revision')
  const displayName = selectedBusiness
    ? (selectedBusiness.businessName || selectedBusiness.tradeName || selectedBusiness.formData?.['Business Name'] || selectedBusiness.formData?.['businessName'] || selectedBusiness.formData?.['Trade Name'] || selectedBusiness.formData?.['tradeName'] || 'Unnamed Business')
    : ''
  const displayReferenceNumber = selectedBusiness?.applicationReferenceNumber || selectedBusiness?.registrationNumber || null

  const openRevisionForm = useCallback((business = selectedBusiness) => {
    if (!business) return
    setEditingBusiness(business)
    setSelectedBusinessId(business.businessId || business._id)
    setShowAddForm(true)
  }, [selectedBusiness])

  const openReadOnlyApplicationForm = useCallback((business = selectedBusiness) => {
    if (!business) return
    setEditingBusiness(business)
    setSelectedBusinessId(business.businessId || business._id)
    setShowAddForm(true)
  }, [selectedBusiness])

  const handleBackFromForm = () => {
    setShowAddForm(false)
    setShowProgressView(false)
    setEditingBusiness(null)
    setSelectedBusinessId(null)
    setFromWelcomeModal(false) // Reset the flag
    fetchBusinesses()
  }

  const handleDeleteApplication = async (business) => {
    const businessId = business.businessId || business._id
    try {
      await deleteBusiness(businessId)
      message.success('Application deleted.')
      if (selectedBusinessId === businessId) {
        setSelectedBusinessId(null)
        setShowAddForm(false)
        setEditingBusiness(null)
      }
      fetchBusinesses()
    } catch (err) {
      console.error('Failed to delete application:', err)
      message.error(err?.message || 'Failed to delete application')
    }
  }

  const handleDeleteDraftClick = () => {
    if (!selectedBusiness) return
    modal.confirm({
      title: 'Delete draft application?',
      content: 'This will permanently remove this draft. You can add a new business later if needed.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleDeleteApplication(selectedBusiness),
    })
  }

  // Search and filter handlers
  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }, [])

  // Business selection handler
  const handleBusinessSelect = useCallback((businessId) => {
    setSelectedBusinessId(businessId)
  }, [])

  const handleAddBusiness = useCallback(() => {
    setBusinessType('permit') // Default to permit registration type
    setFromWelcomeModal(false) // Normal add business flow
    setShowAddForm(true)
    setSelectedBusinessId(null) // Clear any selected business
    setEditingBusiness(null) // Clear editing business
  }, [])

  const handleSelectGeneralBusiness = useCallback(() => {
    setShowWelcomeModal(false)
    setFromWelcomeModal(true) // Coming from welcome modal
    setShowAddForm(true)
    setSelectedBusinessId(null)
    setEditingBusiness(null) // Clear editing business
  }, [])

  const handleSelectHealthcareBusiness = useCallback(() => {
    setShowWelcomeModal(false)
    setFromWelcomeModal(true) // Coming from welcome modal
    setShowAddForm(true)
    setSelectedBusinessId(null)
    setEditingBusiness(null) // Clear editing business
  }, [])

  const handleWelcomeModalSelect = useCallback((registrationType) => {
    setBusinessType(registrationType)
    setShowWelcomeModal(false)
    setFromWelcomeModal(true) // Coming from welcome modal
    setShowAddForm(true)
    setSelectedBusinessId(null)
    setEditingBusiness(null) // Clear editing business
  }, [])

  const handleSort = useCallback((field, order) => {
    setSortBy(field)
    setSortOrder(order)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page)
    setPageSize(size)
  }, [])

  const handleTableChange = useCallback((pagination, filters, sorter) => {
    handlePageChange(pagination.current, pagination.pageSize)
    if (sorter.field) {
      handleSort(sorter.field, sorter.order === 'descend' ? 'desc' : 'asc')
    }
  }, [handlePageChange, handleSort])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchBusinessesPaginated()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, fetchBusinessesPaginated])

  useEffect(() => {
    if (statusFilter !== undefined) {
      fetchBusinessesPaginated()
    }
  }, [statusFilter, fetchBusinessesPaginated])

  useEffect(() => {
    if (sortBy !== undefined && sortOrder !== undefined) {
      fetchBusinessesPaginated()
    }
  }, [sortBy, sortOrder, fetchBusinessesPaginated])

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!currentUser || roleSlug !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..."><div style={{ minHeight: 48 }} /></Spin>
      </div>
    )
  }

  return (
    <BusinessOwnerLayout
      pageTitle="Business Dashboard"
      pageIcon={<ShopOutlined />}
      headerActions={
        <Space size="middle" wrap data-testid="dashboard-header-actions">
          {lastUpdatedAt && (
            <Space size="small" align="center" style={{ 
              background: socketConnected ? 'rgba(82, 196, 26, 0.1)' : 'rgba(0,0,0,0.04)', 
              padding: '4px 12px', 
              borderRadius: 16,
              border: `1px solid ${socketConnected ? 'rgba(82, 196, 26, 0.3)' : 'rgba(0,0,0,0.1)'}`
            }}>
              <Badge 
                status={socketConnected ? 'success' : 'default'} 
                text={socketConnected ? 'Live' : 'Offline'}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Updated {dayjs(lastUpdatedAt).format('h:mm A')}
              </Text>
            </Space>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchBusinesses}
            loading={loading}
            data-testid="refresh-button"
          >
          </Button>
        </Space>
      }
      onSettingsClick={() => setShowSettings(true)} // Open settings in dashboard
    >
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Left panel - Business List (30%) - always visible */}
          <div
            data-testid="business-list-panel"
            style={{
              width: '30%',
              minWidth: 280,
              maxWidth: 400,
              flexShrink: 0,
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              paddingRight: 24,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              background: token.colorBgContainer,
              padding: '24px 24px 24px 16px',
            }}
          >
          {/* Business List Panel */}
          <BusinessListPanel
            businesses={businesses}
            loading={loading}
            selectedBusinessId={selectedBusiness?.businessId || selectedBusiness?._id}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onBusinessSelect={handleBusinessSelect}
            onAddBusiness={handleAddBusiness}
          />
        </div>

        {/* Right panel - Business Details or Settings */}
        <div
          data-testid="business-details-panel"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgContainer,
            overflow: 'hidden',
          }}
        >
          {showSettings ? (
            // Settings View - Full settings interface
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <UserSettingsView 
                  showBackButton={false}
                  themeSettings={themeSettings}
                  embedded={true} // Custom prop to indicate embedded mode
                />
              </div>
            </div>
          ) : (
            // Dashboard View (original content)
            (showAddForm || selectedBusiness) ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {selectedBusiness ? (
                  <>
                    <div
                      style={{
                        flexShrink: 0,
                        padding: '16px 24px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorBgContainer,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <Space size={12}>
                          <span
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: token.borderRadius,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: token.colorPrimaryBg,
                              color: token.colorPrimary,
                            }}
                          >
                            <ShopOutlined style={{ fontSize: 20 }} />
                          </span>
                          <div>
                            <Title level={4} style={{ margin: 0 }}>
                              {displayName}
                            </Title>
                          </div>
                        </Space>
                        <Space size="small">
                          {!isDraft && !isApproved ? (
                            <>
                              <Button onClick={() => setShowAddForm(prev => !prev)}>
                                {showAddForm
                                  ? (isNeedsRevision ? 'View Revision Summary' : isResubmitted ? 'View Resubmission Status' : 'View Progress')
                                  : (isNeedsRevision ? 'Review & Fix Application' : isResubmitted ? 'View Submitted Revisions' : 'View Submitted Application')}
                              </Button>
                              {isNeedsRevision && showAddForm && (
                                <>
                                  <Button
                                    onClick={() => formRef.current?.saveDraft?.()}
                                    loading={formSubmitting}
                                  >
                                    Save as Draft
                                  </Button>
                                  <Button
                                    type="primary"
                                    onClick={() => formRef.current?.submitApplication?.()}
                                    loading={formSubmitting}
                                  >
                                    Resubmit Application
                                  </Button>
                                </>
                              )}
                            </>
                          ) : isDraft ? (
                            <>
                              {import.meta.env.DEV && (
                                <Button
                                  type="dashed"
                                  icon={<BugOutlined />}
                                  onClick={() => formRef.current?.fillTestData?.()}
                                >
                                  Fill with test data
                                </Button>
                              )}
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteDraftClick}
                              >
                                Delete
                              </Button>
                              <Button
                                onClick={() => formRef.current?.saveDraft?.()}
                                loading={formSubmitting}
                              >
                                Save as Draft
                              </Button>
                              <Button
                                type="primary"
                                onClick={() => formRef.current?.submitApplication?.()}
                                loading={formSubmitting}
                              >
                                Submit
                              </Button>
                            </>
                          ) : null}
                        </Space>
                      </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {isApproved && !showAddForm ? (
                        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                          <ApprovedBusinessView business={selectedBusiness} onRefresh={fetchBusinesses} />
                        </div>
                      ) : !isDraft && !showAddForm ? (
                        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                          <PendingApplicationView
                            business={selectedBusiness}
                            onEdit={canEditRevision ? openRevisionForm : undefined}
                            onOpenForm={isResubmitted ? openReadOnlyApplicationForm : undefined}
                          />
                        </div>
                      ) : (
                        <AddBusinessForm
                          ref={formRef}
                          embedded
                          onSubmittingChange={setFormSubmitting}
                          key={`${selectedBusiness?.businessId || selectedBusiness?._id || 'edit'}-${showAddForm}`}
                          onBack={handleBackFromForm}
                          editingBusiness={selectedBusiness}
                          readOnly={!isDraft && !canEditRevision}
                          hideActionButtons={isNeedsRevision}
                          onSubmitted={(response) => {
                            if (response?.businesses?.length) setBusinesses(response.businesses)
                            else fetchBusinesses()
                            setShowAddForm(false)
                          }}
                          onDraftCreated={(newBusiness) => {
                            setBusinesses(prev => [newBusiness, ...prev.filter(b => (b.businessId || b._id) !== (newBusiness.businessId || newBusiness._id))])
                            setEditingBusiness(newBusiness)
                            setSelectedBusinessId(newBusiness.businessId || newBusiness._id)
                            fetchBusinesses()
                          }}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <AddBusinessForm
                    onBack={handleBackFromForm}
                    editingBusiness={editingBusiness}
                    initialRegistrationType={fromWelcomeModal ? businessType : null}
                    onDraftCreated={(newBusiness) => {
                      // Add the new business to state immediately so selectedBusiness is available
                      // This prevents a race condition where selectedBusinessId is set but
                      // businesses array hasn't been updated yet, causing the non-embedded form
                      // to re-render with initialRegistrationType still set
                      const newId = newBusiness.businessId || newBusiness._id
                      setBusinesses(prev => [newBusiness, ...prev.filter(b => (b.businessId || b._id) !== newId)])
                      setEditingBusiness(newBusiness)
                      setSelectedBusinessId(newId)
                      setFromWelcomeModal(false) // Clear the flag to prevent re-triggering
                      setHasClosedWelcomeModal(false) // Reset flag - user has created a business
                      // Refresh in background to sync with server
                      fetchBusinesses()
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description={businesses.length === 0 ? "Add your first business to get started" : "Select a business to view details"} />
              </div>
            )
          )}
        </div>
      </div>

      {/* Welcome Modal for New Users */}
      <WelcomeModal
        visible={showWelcomeModal}
        onSelect={handleWelcomeModalSelect}
        onClose={() => {
          setShowWelcomeModal(false)
          setHasClosedWelcomeModal(true)
        }}
      />
    </BusinessOwnerLayout>
  )
}
