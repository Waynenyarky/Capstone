import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Empty, Typography, Splitter, Input, Button, Tooltip, Select, Tag, theme, Drawer, Grid } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { SearchOutlined, PlusOutlined, FormOutlined, FilterOutlined, CloseOutlined, FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined, SafetyCertificateOutlined, ClockCircleFilled, MinusCircleOutlined } from '@ant-design/icons'
import ApplicationDetailPanel from '../components/ApplicationDetailPanel'
import AppealDetailPanel from '../components/AppealDetailPanel'
import EditRequestDetailPanel from '../components/EditRequestDetailPanel'
import CessationDetailPanel from '../components/CessationDetailPanel'
import InspectionDetailPanel from '../components/InspectionDetailPanel'
import BusinessOwnerDetailPanel from '../components/BusinessOwnerDetailPanel'
import EditOwnerModal from '../components/EditOwnerModal'
import LogDetailPanel from '../components/LogDetailPanel'
import LogsTable from '../components/LogsTable'
import HelpRequestsPanel from '../components/HelpRequestsPanel'
import HelpRequestDetailPanel from '../components/HelpRequestDetailPanel'
import ClaimBar from '../components/ClaimBar'
import OfficerItemCard from '../components/OfficerItemCard'
import OwnersListPanel from '../components/OwnersListPanel'
import PermitApplicationForm from '@/features/business-owner/components/forms/PermitApplicationForm'
import ConsolidatedProfileNav from '@/features/user/pages/profileSettings/ConsolidatedProfileNav'
import ConsolidatedContentRenderer from '@/features/user/pages/profileSettings/ConsolidatedContentRenderer'
import { CONSOLIDATED_NAV_ITEMS } from '@/features/user/pages/profileSettings/constants'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'
import { put } from '@/lib/http.js'

const { Text } = Typography
const { useBreakpoint } = Grid

export default function OfficerRightPanel({
  selectedItem,
  onItemSelect,
  activeTab,
  onReviewComplete,
  onClaimChange,
  onCreateWalkIn,
  onRegisterOwner,
  refresh,
  officerData,
  showSettings = false,
  setShowSettings,
  themeSettings,
}) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [settingsKey, setSettingsKey] = useState('mfa') // Default to MFA for staff
  const [toReviewSubTab, setToReviewSubTab] = useState('applications') // Sub-tab for To Review
  const [subItemIndex, setSubItemIndex] = useState(0) // Selected item within multi-item sub-tabs
  const filterWrapperRef = React.useRef(null)
  const { reviewApplication } = usePermitApplications()
  const formRef = useRef(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editOwnerModalOpen, setEditOwnerModalOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  
  // Filter nav items for staff (security and theme sections only)
  const settingsNavItems = useMemo(() => {
    return CONSOLIDATED_NAV_ITEMS.filter(item => 
      item.section === 'security' || item.section === 'theme'
    )
  }, [])

  const handleApplicationReviewComplete = useCallback(async () => {
    onReviewComplete?.()
  }, [onReviewComplete])

  const handleReviewStarted = useCallback(async (updatedApp) => {
    // no-op for now, parent refresh handles it
  }, [])

  // Reset search and filter when tab changes
  useEffect(() => {
    setSearch('')
    setStatusFilter(null)
    setFilterOpen(false)
  }, [activeTab])

  // Reset sub-tab to 'application' when a new business card is selected in To Review
  useEffect(() => {
    if (activeTab === 'toReview' && selectedItem?._itemType === 'business') {
      setToReviewSubTab('application')
      setSubItemIndex(0)
    }
  }, [activeTab, selectedItem?._itemId])

  // Open detail drawer on mobile when help request is selected
  useEffect(() => {
    if (activeTab === 'helpRequests' && selectedItem?._itemType === 'helpRequests' && !screens.lg) {
      setDetailDrawerOpen(true)
    } else if (activeTab !== 'helpRequests' || selectedItem?._itemType !== 'helpRequests') {
      setDetailDrawerOpen(false)
    }
  }, [activeTab, selectedItem, screens.lg])

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(e.target)) {
        const isSelectDropdown = e.target.closest('.ant-select-dropdown')
        if (!isSelectDropdown) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  // Get current list from officerData
  const currentList = useMemo(() => {
    if (!officerData) return []
    
    const lists = {
      toReview: officerData.toReview, // Consolidated business cards
      applications: officerData.applications,
      appeals: officerData.appeals,
      editRequests: officerData.editRequests,
      renewals: officerData.renewals,
      cessation: officerData.cessations,
      inspections: officerData.inspections,
      helpRequests: officerData.helpRequests,
      owners: officerData.owners,
      drafts: officerData.drafts,
      logs: officerData.logs,
    }
    let list = lists[activeTab] || []

    // Apply status filter
    if (statusFilter) {
      list = list.filter(item => {
        const s = item.status || item.applicationStatus || item.retirementStatus || ''
        return s === statusFilter
      })
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(item => {
        const name = (item.businessName || item.fieldName || item.firstName || item.eventType || '').toLowerCase()
        const ref = (item.applicationReferenceNumber || item._id || '').toLowerCase()
        const email = (item.email || '').toLowerCase()
        return name.includes(q) || ref.includes(q) || email.includes(q)
      })
    }

    // Sort by date
    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
  }, [activeTab, officerData, search, statusFilter])

  const isLoading = officerData?.isLoading

  const getItemId = (item) => {
    return item.applicationId || item._id || item.businessId
  }

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    // For To Review, use 'business' type for consolidated cards; otherwise use the main tab
    const itemType = activeTab === 'toReview' ? (item._itemType || 'business') : activeTab
    onItemSelect({ ...item, _itemType: itemType, _itemId: id })
  }, [activeTab, onItemSelect])

  // Status filter options per tab
  const STATUS_FILTER_OPTIONS = {
    toReview: [
      { value: 'all', label: 'All' },
      { value: 'submitted', label: 'Pending Review' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'resubmit', label: 'Resubmitted' },
      { value: 'pending', label: 'Pending' },
      { value: 'pending_renewal', label: 'Pending Renewal' },
      { value: 'renewal_submitted', label: 'Renewal Submitted' },
      { value: 'requested', label: 'Requested' },
      { value: 'inspector_verified', label: 'Inspector Verified' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'appeal_pending', label: 'Appeal Pending' },
      { value: 'upheld', label: 'Upheld' },
      { value: 'overturned', label: 'Overturned' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'returned', label: 'Returned' },
    ],
    applications: [
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Pending Review' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'resubmit', label: 'Resubmitted' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'returned', label: 'Returned' },
    ],
    appeals: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'submitted', label: 'Submitted' },
    ],
    editRequests: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ],
    renewals: [
      { value: 'all', label: 'All' },
      { value: 'pending_renewal', label: 'Pending Renewal' },
      { value: 'renewal_submitted', label: 'Renewal Submitted' },
    ],
    cessation: [
      { value: 'all', label: 'All' },
      { value: 'requested', label: 'Requested' },
      { value: 'inspector_verified', label: 'Inspector Verified' },
      { value: 'pending_tax_payment', label: 'Pending Tax Payment' },
    ],
    inspections: [
      { value: 'all', label: 'All' },
      { value: 'pending_assignment', label: 'Needs Assignment' },
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ],
    drafts: [
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
    ],
  }

  const filterOptions = STATUS_FILTER_OPTIONS[activeTab] || null

  const activeFilterCount = statusFilter ? 1 : 0

  // Render the list panel content
  const renderListPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search + filter + actions */}
      <div style={{ flexShrink: 0, padding: '12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', gap: 8, alignItems: 'center' }} ref={filterWrapperRef}>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          {filterOptions && filterOptions.length > 1 && (
            <Tooltip title="Filters">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen(prev => !prev)}
              />
            </Tooltip>
          )}

          {/* Floating filter panel */}
          {filterOpen && filterOptions && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                padding: '16px 20px',
                background: '#fff',
                borderRadius: 10,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                zIndex: 50,
                minWidth: 240,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 13 }}>Filters</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined style={{ fontSize: 12 }} />}
                  onClick={() => setFilterOpen(false)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <Select
                  placeholder="All statuses"
                  allowClear
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  options={filterOptions.filter(o => o.value !== 'all')}
                />
              </div>
              {activeFilterCount > 0 && (
                <Button size="small" type="link" onClick={() => setStatusFilter(null)} style={{ alignSelf: 'flex-start', padding: 0 }}>
                  Clear filter
                </Button>
              )}
            </div>
          )}
        </div>

        {['applications', 'renewals', 'editRequests', 'cessation'].includes(activeTab) && (
          <Tooltip title="Walk-In Application">
            <Button icon={<FormOutlined />} onClick={() => onCreateWalkIn()}>Walk-In</Button>
          </Tooltip>
        )}
        {activeTab === 'owners' && (
          <Tooltip title="Register New Owner">
            <Button icon={<PlusOutlined />} onClick={onRegisterOwner}>Register</Button>
          </Tooltip>
        )}
        {activeTab === 'drafts' && (
          <Tooltip title="Create Walk-In Application">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onCreateWalkIn()}>Walk-In</Button>
          </Tooltip>
        )}
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><LottieSpinner /></div>
        ) : currentList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? 'No results' : 'No items'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentList.map(item => {
              const id = getItemId(item)
              const itemType = activeTab === 'toReview' ? (item._itemType || 'business') : activeTab
              const itemKey = `${itemType}:${id}`
              return (
                <OfficerItemCard
                  key={itemKey}
                  item={item}
                  type={activeTab}
                  isSelected={selectedItem?._itemId === id && selectedItem?._itemType === itemType}
                  onClick={() => handleItemClick(item)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // Render the detail panel content
  const renderDetailPanel = () => {
    if (!selectedItem) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select an item to view details"
          />
        </div>
      )
    }

    const type = selectedItem._itemType || activeTab

  // ── Consolidated Business (To Review tab) ──
    if (type === 'business') {
      const requests = selectedItem._requests || {}
      const hasApplication = !!requests.application
      const hasAppeals = (requests.appeals?.length || 0) > 0
      const hasEditRequests = (requests.editRequests?.length || 0) > 0
      const hasCessation = !!requests.cessation
      const hasInspections = (requests.inspections?.length || 0) > 0

      // Sub-tab config with status icons and counts
      const appealsCount = requests.appeals?.length || 0
      const editsCount = requests.editRequests?.length || 0
      const inspectionsCount = requests.inspections?.length || 0
      const subTabs = [
        { key: 'application', label: 'Application', icon: <FileTextOutlined />, has: hasApplication },
        { key: 'appeals', label: appealsCount > 1 ? `Appeals (${appealsCount})` : 'Appeals', icon: <AuditOutlined />, has: hasAppeals },
        { key: 'editRequests', label: editsCount > 1 ? `Edits (${editsCount})` : 'Edits', icon: <EditOutlined />, has: hasEditRequests },
        { key: 'cessation', label: 'Cessation', icon: <StopOutlined />, has: hasCessation },
        { key: 'inspections', label: inspectionsCount > 1 ? `Inspections (${inspectionsCount})` : 'Inspections', icon: <SafetyCertificateOutlined />, has: hasInspections },
      ]

      // Render content based on selected sub-tab
      const renderSubTabContent = () => {
        const currentTab = subTabs.find(t => t.key === toReviewSubTab)
        if (!currentTab?.has) {
          return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${currentTab?.label?.toLowerCase() || 'items'} for this business`} />
            </div>
          )
        }

        switch (toReviewSubTab) {
          case 'application':
            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flexShrink: 0 }}>
                  <ClaimBar application={requests.application} onClaimChange={onClaimChange} />
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <ApplicationDetailPanel
                    application={requests.application}
                    onReviewComplete={handleApplicationReviewComplete}
                    onReviewStarted={handleReviewStarted}
                    onReview={reviewApplication}
                    onSelectApplication={onItemSelect}
                  />
                </div>
              </div>
            )
          case 'appeals': {
            const items = requests.appeals || []
            const selected = items[subItemIndex] || items[0]
            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {items.length > 1 && (
                  <div style={{ flexShrink: 0, padding: '8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map((item, idx) => {
                      const s = item.status || 'pending'
                      const color = s === 'submitted' || s === 'pending' || s === 'under_review' ? 'processing' : s === 'upheld' || s === 'approved' ? 'success' : s === 'overturned' || s === 'rejected' ? 'error' : 'default'
                      return (
                        <Tag key={item._id || idx} color={subItemIndex === idx ? 'blue' : color}
                          style={{ cursor: 'pointer', margin: 0 }} onClick={() => setSubItemIndex(idx)}>
                          Appeal {idx + 1} · {s}
                        </Tag>
                      )
                    })}
                  </div>
                )}
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <AppealDetailPanel appeal={selected} onReviewComplete={onReviewComplete} />
                </div>
              </div>
            )
          }
          case 'editRequests': {
            const items = requests.editRequests || []
            const selected = items[subItemIndex] || items[0]
            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {items.length > 1 && (
                  <div style={{ flexShrink: 0, padding: '8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map((item, idx) => {
                      const s = item.status || 'pending'
                      const color = s === 'pending' ? 'processing' : s === 'approved' ? 'success' : s === 'rejected' ? 'error' : 'default'
                      return (
                        <Tag key={item._id || idx} color={subItemIndex === idx ? 'blue' : color}
                          style={{ cursor: 'pointer', margin: 0 }} onClick={() => setSubItemIndex(idx)}>
                          {item.fieldName || `Edit ${idx + 1}`} · {s}
                        </Tag>
                      )
                    })}
                  </div>
                )}
                <div style={{ flexShrink: 0 }}>
                  <ClaimBar
                    item={selected}
                    onClaimChange={onClaimChange}
                    apiBasePath="/api/business/edit-requests"
                    entityLabel="edit request"
                  />
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <EditRequestDetailPanel request={selected} onReviewComplete={onReviewComplete} />
                </div>
              </div>
            )
          }
          case 'cessation':
            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flexShrink: 0 }}>
                  <ClaimBar
                    item={requests.cessation}
                    onClaimChange={onClaimChange}
                    apiBasePath="/api/business/retirements"
                    entityLabel="cessation request"
                  />
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <CessationDetailPanel cessation={requests.cessation} onReviewComplete={onReviewComplete} />
                </div>
              </div>
            )
          case 'inspections': {
            const items = requests.inspections || []
            const selected = items[subItemIndex] || items[0]
            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {items.length > 1 && (
                  <div style={{ flexShrink: 0, padding: '8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map((item, idx) => {
                      const s = item.status || 'pending'
                      const color = s === 'pending_assignment' ? 'warning' : s === 'pending' ? 'processing' : s === 'in_progress' ? 'processing' : s === 'completed' ? 'success' : 'default'
                      return (
                        <Tag key={item._id || idx} color={subItemIndex === idx ? 'blue' : color}
                          style={{ cursor: 'pointer', margin: 0 }} onClick={() => setSubItemIndex(idx)}>
                          {item.inspectionType || `Inspection ${idx + 1}`} · {s === 'pending_assignment' ? 'Needs Assignment' : s}
                        </Tag>
                      )
                    })}
                  </div>
                )}
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <InspectionDetailPanel inspection={selected} onReviewComplete={onReviewComplete} />
                </div>
              </div>
            )
          }
          default:
            return <Empty description="Select a tab" />
        }
      }

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 2.2 Header: Just business name */}
          <div style={{ 
            flexShrink: 0, 
            padding: '12px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
          }}>
            <Text strong style={{ fontSize: 16 }}>{selectedItem.businessName || 'Unknown Business'}</Text>
          </div>
          {/* 2.2.1 + 2.2.2: Vertical sub-tabs on left, content on right */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
            {/* 2.2.1 Left panel: Vertical sub-tab buttons */}
            <div style={{ 
              width: 160, 
              minWidth: 160, 
              flexShrink: 0,
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              overflowY: 'auto',
              background: token.colorBgContainer,
            }}>
              {subTabs.map(tab => {
                const isActive = toReviewSubTab === tab.key
                return (
                  <div
                    key={tab.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setToReviewSubTab(tab.key); setSubItemIndex(0) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setToReviewSubTab(tab.key); setSubItemIndex(0) } }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      borderRadius: token.borderRadius,
                      cursor: 'pointer',
                      background: isActive ? token.colorFillTertiary : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = token.colorFillQuaternary
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: token.borderRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isActive ? token.colorPrimary : token.colorFillQuaternary,
                        color: isActive ? '#fff' : token.colorTextSecondary,
                        flexShrink: 0,
                        fontSize: 14,
                      }}
                    >
                      {tab.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong={isActive}
                        type={isActive ? undefined : 'secondary'}
                        style={{ 
                          fontSize: 12, 
                          lineHeight: 1.3,
                          display: 'block',
                          ...(isActive && { color: token.colorPrimary })
                        }}
                      >
                        {tab.label}
                      </Text>
                    </div>
                    {/* Status indicator */}
                    {tab.has ? (
                      <ClockCircleFilled style={{ color: token.colorWarning, fontSize: 10 }} />
                    ) : (
                      <MinusCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 10 }} />
                    )}
                  </div>
                )
              })}
            </div>
            {/* 2.2.2 Right panel: Content for selected sub-tab */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {renderSubTabContent()}
            </div>
          </div>
        </div>
      )
    }

  // ── Applications, Renewals → ApplicationDetailPanel with ClaimBar ──
    if (type === 'applications' || type === 'renewals') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '0' }}>
            <ClaimBar application={selectedItem} onClaimChange={onClaimChange} />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ApplicationDetailPanel
              application={selectedItem}
              onReviewComplete={handleApplicationReviewComplete}
              onReviewStarted={handleReviewStarted}
              onReview={reviewApplication}
              onSelectApplication={onItemSelect}
            />
          </div>
        </div>
      )
    }

    // ── Appeals ──
    if (type === 'appeals') {
      return <AppealDetailPanel appeal={selectedItem} onReviewComplete={onReviewComplete} />
    }

    // ── Edit Requests ──
    if (type === 'editRequests') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '0' }}>
            <ClaimBar
              item={selectedItem}
              onClaimChange={onClaimChange}
              apiBasePath="/api/business/edit-requests"
              entityLabel="edit request"
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <EditRequestDetailPanel request={selectedItem} onReviewComplete={onReviewComplete} />
          </div>
        </div>
      )
    }

    // ── Cessation ──
    if (type === 'cessation') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '0' }}>
            <ClaimBar
              item={selectedItem}
              onClaimChange={onClaimChange}
              apiBasePath="/api/business/retirements"
              entityLabel="cessation request"
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <CessationDetailPanel cessation={selectedItem} onReviewComplete={onReviewComplete} />
          </div>
        </div>
      )
    }

    // ── Inspections ──
    if (type === 'inspections') {
      return <InspectionDetailPanel inspection={selectedItem} onReviewComplete={onReviewComplete} />
    }

    // ── Business Owners ──
    if (type === 'owners') {
      return (
        <BusinessOwnerDetailPanel
          owner={selectedItem}
          onCreateWalkIn={onCreateWalkIn}
          onEditOwner={(owner) => {
            setEditingOwner(owner)
            setEditOwnerModalOpen(true)
          }}
        />
      )
    }

    // ── Drafts → PermitApplicationForm in embedded mode ──
    if (type === 'drafts') {
      return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <PermitApplicationForm
            ref={formRef}
            embedded
            onSubmittingChange={setFormSubmitting}
            key={selectedItem?._itemId || selectedItem?.applicationId || 'draft'}
            editingApplication={selectedItem}
            readOnly={false}
            onBack={() => { refresh?.() }}
            onSubmitted={() => {
              refresh?.()
            }}
            onDraftCreated={() => {
              refresh?.()
            }}
            updateFn={(businessId, payload) => put(`/api/business/walk-in/${businessId}`, payload)}
          />
        </div>
      )
    }

    // ── Logs ──
    if (type === 'logs') {
      return <LogDetailPanel log={selectedItem} />
    }

    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="Unknown item type" />
      </div>
    )
  }

  // Help Requests tab - dedicated panel layout
  if (activeTab === 'helpRequests' && !showSettings) {
    // Mobile view: list as main panel, detail in bottom drawer
    if (!screens.lg) {
      return (
        <>
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <HelpRequestsPanel
              helpRequests={officerData?.helpRequests || []}
              isLoading={officerData?.loadingMap?.helpRequests}
              selectedId={selectedItem?._itemId}
              onSelectRequest={(req) => onItemSelect({ ...req, _itemType: 'helpRequests', _itemId: req.requestId })}
            />
          </div>
          <Drawer
            title="Request details"
            open={detailDrawerOpen}
            onClose={() => {
              setDetailDrawerOpen(false)
              onItemSelect(null)
            }}
            placement="bottom"
            height="100%"
            styles={{ body: { padding: 0 } }}
          >
            {selectedItem?._itemType === 'helpRequests' && (
              <HelpRequestDetailPanel
                request={selectedItem}
                onRefresh={() => officerData?.refreshHelpRequests?.()}
              />
            )}
          </Drawer>
        </>
      )
    }

    // Desktop view: splitter layout
    return (
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
          <HelpRequestsPanel
            helpRequests={officerData?.helpRequests || []}
            isLoading={officerData?.loadingMap?.helpRequests}
            selectedId={selectedItem?._itemId}
            onSelectRequest={(req) => onItemSelect({ ...req, _itemType: 'helpRequests', _itemId: req.requestId })}
          />
        </Splitter.Panel>
        <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedItem?._itemType === 'helpRequests' ? (
            <HelpRequestDetailPanel
              request={selectedItem}
              onBack={() => onItemSelect(null)}
              onRefresh={() => officerData?.refreshHelpRequests?.()}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a help request to view details" />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    )
  }

  // For logs tab, render two-panel layout: table on left (30%), detail on right (70%)
  if (activeTab === 'logs' && !showSettings) {
    return (
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="30%" defaultSize="25%" style={{ overflow: 'hidden' }}>
          <LogsTable
            logs={currentList}
            loading={isLoading}
            selectedLog={selectedItem}
            onSelectLog={(log) => onItemSelect({ ...log, _itemType: 'logs', _itemId: log._id || log.id })}
          />
        </Splitter.Panel>
        <Splitter.Panel min="40%" defaultSize="75%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <LogDetailPanel log={selectedItem} />
        </Splitter.Panel>
      </Splitter>
    )
  }

  // Main render with Splitter
  // When showing settings, render settings panels instead of list/detail
  if (showSettings) {
    return (
      <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
        {/* Settings Nav Panel */}
        <div style={{
          width: 260,
          minWidth: 260,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          padding: 16,
          overflowY: 'auto',
          background: token.colorBgContainer,
        }}>
          <ConsolidatedProfileNav
            selectedKey={settingsKey}
            onSelectKey={setSettingsKey}
            navItems={settingsNavItems}
          />
        </div>
        {/* Settings Content Panel */}
        <div style={{ 
          flex: 1, 
          minWidth: 0, 
          overflow: 'auto',
          padding: 24,
          background: token.colorBgContainer,
        }}>
          <ConsolidatedContentRenderer
            selectedKey={settingsKey}
            themeSettings={themeSettings}
            isBusinessOwner={false}
            isStaffOrAdmin={true}
          />
        </div>
      </div>
    )
  }

  // Special handling for owners tab - use table layout
  if (activeTab === 'owners') {
    return (
      <>
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel min="30%" defaultSize="25%" style={{ overflow: 'hidden' }}>
            <OwnersListPanel
              owners={officerData?.owners || []}
              isLoading={officerData?.isLoading}
              selectedOwner={selectedItem}
              onSelectOwner={(owner) => onItemSelect({ ...owner, _itemType: 'owners', _itemId: owner._id })}
              onRegisterOwner={onRegisterOwner}
              ownerSearch={officerData?.ownerSearch || ''}
              setOwnerSearch={officerData?.setOwnerSearch}
            />
          </Splitter.Panel>
          <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderDetailPanel()}
          </Splitter.Panel>
        </Splitter>

        <EditOwnerModal
          open={editOwnerModalOpen}
          owner={editingOwner}
          onClose={() => {
            setEditOwnerModalOpen(false)
            setEditingOwner(null)
          }}
          onSuccess={() => {
            refresh?.()
          }}
        />
      </>
    )
  }

  return (
    <>
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
          {renderListPanel()}
        </Splitter.Panel>
        <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderDetailPanel()}
        </Splitter.Panel>
      </Splitter>

      <EditOwnerModal
        open={editOwnerModalOpen}
        owner={editingOwner}
        onClose={() => {
          setEditOwnerModalOpen(false)
          setEditingOwner(null)
        }}
        onSuccess={() => {
          refresh?.()
        }}
      />
    </>
  )
}
