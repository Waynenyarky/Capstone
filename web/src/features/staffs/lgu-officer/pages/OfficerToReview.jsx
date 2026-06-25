import { useState, useCallback, useMemo, useEffect } from 'react'
import { Empty, Splitter, Typography, Tag, theme } from 'antd'
import { FileTextOutlined, AuditOutlined, EditOutlined, StopOutlined, SafetyCertificateOutlined, ClockCircleFilled, MinusCircleOutlined } from '@ant-design/icons'
import ApplicationDetailPanel from './applications/components/ApplicationDetailPanel'
import AppealDetailPanel from '../components/AppealDetailPanel'
import EditRequestDetailPanel from '../components/EditRequestDetailPanel'
import CessationDetailPanel from '../components/CessationDetailPanel'
import InspectionDetailPanel from '../components/InspectionDetailPanel'
import ClaimBar from '../components/ClaimBar'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'

const { Text } = Typography

const STATUS_FILTER_OPTIONS = [
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
]

export default function OfficerToReview({ officerData, onReviewComplete, onClaimChange, onItemSelect }) {
  const { token } = theme.useToken()
  const [selectedItem, setSelectedItem] = useState(null)
  const [toReviewSubTab, setToReviewSubTab] = useState('application')
  const [subItemIndex, setSubItemIndex] = useState(0)
  const listPanel = useOfficerListPanel({ activeTab: 'toReview' })
  const { reviewApplication } = usePermitApplications()

  // Reset sub-tab to 'application' when a new business card is selected
  useEffect(() => {
    if (selectedItem?._itemType === 'business') {
      setToReviewSubTab('application')
      setSubItemIndex(0)
    }
  }, [selectedItem?._itemId])

  const getItemId = useCallback((item) => {
    return item._id || item.businessId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.toReview || []

    if (listPanel.statusFilter) {
      list = list.filter(item => {
        const s = item.status || item.applicationStatus || item.retirementStatus || ''
        return s === listPanel.statusFilter
      })
    }

    if (listPanel.search.trim()) {
      const q = listPanel.search.trim().toLowerCase()
      list = list.filter(item => {
        const name = (item.businessName || '').toLowerCase()
        const ref = (item.applicationReferenceNumber || item._id || '').toLowerCase()
        return name.includes(q) || ref.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
  }, [officerData?.toReview, listPanel.statusFilter, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'business', _itemId: id })
  }, [getItemId])

  const handleApplicationReviewComplete = useCallback(async () => {
    onReviewComplete?.()
  }, [onReviewComplete])

  const handleReviewStarted = useCallback(async () => {
    // no-op for now
  }, [])

  // Render detail panel for consolidated business card
  const renderDetailPanel = () => {
    if (!selectedItem) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="Select a business to review" />
        </div>
      )
    }

    const requests = selectedItem._requests || {}
    const hasApplication = !!requests.application
    const hasAppeals = (requests.appeals?.length || 0) > 0
    const hasEditRequests = (requests.editRequests?.length || 0) > 0
    const hasCessation = !!requests.cessation
    const hasInspections = (requests.inspections?.length || 0) > 0

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
                    const color = s === 'pending_assignment' ? 'warning' : s === 'pending' || s === 'in_progress' ? 'processing' : s === 'completed' ? 'success' : 'default'
                    return (
                      <Tag key={item._id || idx} color={subItemIndex === idx ? 'blue' : color}
                        style={{ cursor: 'pointer', margin: 0 }} onClick={() => setSubItemIndex(idx)}>
                        Inspection {idx + 1} · {s}
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
          return <Empty description="Unknown tab" />
      }
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Business name header */}
        <div style={{ flexShrink: 0, padding: '16px 20px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <Text strong style={{ fontSize: 16 }}>{selectedItem.businessName || 'Unknown Business'}</Text>
        </div>
        {/* Vertical sub-tabs on left, content on right */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {/* Left panel: Vertical sub-tab buttons */}
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
                  {tab.has ? (
                    <ClockCircleFilled style={{ color: token.colorWarning, fontSize: 10 }} />
                  ) : (
                    <MinusCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 10 }} />
                  )}
                </div>
              )
            })}
          </div>
          {/* Right panel: Content for selected sub-tab */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {renderSubTabContent()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.toReview}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={STATUS_FILTER_OPTIONS}
          statusFilter={listPanel.statusFilter}
          onFilterChange={listPanel.handleFilterChange}
          filterOpen={listPanel.filterOpen}
          onFilterToggle={listPanel.handleFilterToggle}
          onFilterClear={listPanel.handleFilterClear}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="toReview"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {renderDetailPanel()}
      </Splitter.Panel>
    </Splitter>
  )
}
