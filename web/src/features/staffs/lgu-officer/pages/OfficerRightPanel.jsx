import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Empty, Typography, Splitter, Input, Spin, Button, Tooltip, Select, theme } from 'antd'
import { SearchOutlined, PlusOutlined, FormOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import ApplicationDetailPanel from '../components/ApplicationDetailPanel'
import AppealDetailPanel from '../components/AppealDetailPanel'
import EditRequestDetailPanel from '../components/EditRequestDetailPanel'
import CessationDetailPanel from '../components/CessationDetailPanel'
import BusinessOwnerDetailPanel from '../components/BusinessOwnerDetailPanel'
import LogDetailPanel from '../components/LogDetailPanel'
import LogsTable from '../components/LogsTable'
import ClaimBar from '../components/ClaimBar'
import OfficerItemCard from '../components/OfficerItemCard'
import OwnersListPanel from '../components/OwnersListPanel'
import AddBusinessForm from '@/features/business-owner/components/AddBusinessForm'
import ConsolidatedProfileNav from '@/features/user/pages/profileSettings/ConsolidatedProfileNav'
import ConsolidatedContentRenderer from '@/features/user/pages/profileSettings/ConsolidatedContentRenderer'
import { CONSOLIDATED_NAV_ITEMS } from '@/features/user/pages/profileSettings/constants'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'

const { Text } = Typography

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [settingsKey, setSettingsKey] = useState('mfa') // Default to MFA for staff
  const filterWrapperRef = React.useRef(null)
  const { reviewApplication } = usePermitApplications()
  const formRef = useRef(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  
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
      toReview: officerData.toReview,
      applications: officerData.applications,
      appeals: officerData.appeals,
      editRequests: officerData.editRequests,
      renewals: officerData.renewals,
      cessation: officerData.cessations,
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
    // For toReview tab, treat items as applications for detail view
    const itemType = activeTab === 'toReview' ? 'applications' : activeTab
    onItemSelect({ ...item, _itemType: itemType, _itemId: id })
  }, [activeTab, onItemSelect])

  // Status filter options per tab
  const STATUS_FILTER_OPTIONS = {
    toReview: [
      { value: 'all', label: 'All' },
      { value: 'submitted', label: 'Pending Review' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'resubmit', label: 'Resubmitted' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
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
      { value: 'submitted', label: 'Submitted' },
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
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : currentList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? 'No results' : 'No items'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentList.map(item => {
              const id = getItemId(item)
              return (
                <OfficerItemCard
                  key={id}
                  item={item}
                  type={activeTab}
                  isSelected={selectedItem?._itemId === id}
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

  // ── Applications, Renewals, To Review → ApplicationDetailPanel with ClaimBar ──
    if (type === 'applications' || type === 'renewals' || type === 'toReview') {
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
      return <EditRequestDetailPanel request={selectedItem} onReviewComplete={onReviewComplete} />
    }

    // ── Cessation ──
    if (type === 'cessation') {
      return <CessationDetailPanel cessation={selectedItem} onReviewComplete={onReviewComplete} />
    }

    // ── Business Owners ──
    if (type === 'owners') {
      return <BusinessOwnerDetailPanel owner={selectedItem} onCreateWalkIn={onCreateWalkIn} />
    }

    // ── Drafts → AddBusinessForm in embedded mode ──
    if (type === 'drafts') {
      return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AddBusinessForm
            ref={formRef}
            embedded
            onSubmittingChange={setFormSubmitting}
            key={selectedItem?._itemId || selectedItem?.applicationId || 'draft'}
            editingBusiness={selectedItem}
            readOnly={false}
            onBack={() => { refresh?.() }}
            onSubmitted={() => {
              refresh?.()
            }}
            onDraftCreated={() => {
              refresh?.()
            }}
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

  // For logs tab, render two-panel layout: table on left (30%), detail on right (70%)
  if (activeTab === 'logs' && !showSettings) {
    return (
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
          <LogsTable
            logs={currentList}
            loading={isLoading}
            selectedLog={selectedItem}
            onSelectLog={(log) => onItemSelect({ ...log, _itemType: 'logs', _itemId: log._id || log.id })}
          />
        </Splitter.Panel>
        <Splitter.Panel min="40%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="30%" defaultSize="40%" style={{ overflow: 'hidden' }}>
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
        <Splitter.Panel min="50%" defaultSize="60%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderDetailPanel()}
        </Splitter.Panel>
      </Splitter>
    )
  }

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {renderListPanel()}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderDetailPanel()}
      </Splitter.Panel>
    </Splitter>
  )
}
