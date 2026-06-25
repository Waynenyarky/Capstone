import { useState, useCallback, useMemo } from 'react'
import { Empty, Splitter } from 'antd'
import ApplicationDetailPanel from './applications/components/ApplicationDetailPanel'
import ClaimBar from '../components/ClaimBar'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'
import { usePermitApplications } from '@/features/lgu-officer/presentation/hooks/usePermitApplications'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending_renewal', label: 'Pending Renewal' },
  { value: 'renewal_submitted', label: 'Renewal Submitted' },
]

export default function OfficerRenewals({ officerData, onReviewComplete, onClaimChange, onItemSelect }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'renewals' })
  const { reviewApplication } = usePermitApplications()

  const getItemId = useCallback((item) => {
    return item.applicationId || item._id || item.businessId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.renewals || []

    if (listPanel.statusFilter) {
      list = list.filter(item => (item.status || item.applicationStatus) === listPanel.statusFilter)
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
  }, [officerData?.renewals, listPanel.statusFilter, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'renewals', _itemId: id })
  }, [getItemId])

  const handleApplicationReviewComplete = useCallback(async () => {
    onReviewComplete?.()
  }, [onReviewComplete])

  const handleReviewStarted = useCallback(async () => {
    // no-op for now
  }, [])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.renewals}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={STATUS_FILTER_OPTIONS}
          statusFilter={listPanel.statusFilter}
          onFilterChange={listPanel.handleFilterChange}
          filterOpen={listPanel.filterOpen}
          onFilterToggle={listPanel.handleFilterToggle}
          onFilterClear={listPanel.handleFilterClear}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="renewals"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
          showWalkInButton
          onWalkIn={() => {}}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {!selectedItem ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select a renewal to view details" />
          </div>
        ) : (
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
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
