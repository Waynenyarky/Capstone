import { useState, useCallback, useMemo } from 'react'
import { Empty, Splitter } from 'antd'
import EditRequestDetailPanel from '../components/EditRequestDetailPanel'
import ClaimBar from '../components/ClaimBar'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function OfficerEditRequests({ officerData, onReviewComplete, onClaimChange }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'editRequests' })

  const getItemId = useCallback((item) => {
    return item._id || item.editRequestId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.editRequests || []

    if (listPanel.statusFilter) {
      list = list.filter(item => item.status === listPanel.statusFilter)
    }

    if (listPanel.search.trim()) {
      const q = listPanel.search.trim().toLowerCase()
      list = list.filter(item => {
        const name = (item.businessName || item.fieldName || '').toLowerCase()
        const ref = (item._id || '').toLowerCase()
        return name.includes(q) || ref.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
  }, [officerData?.editRequests, listPanel.statusFilter, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'editRequests', _itemId: id })
  }, [getItemId])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.editRequests}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={STATUS_FILTER_OPTIONS}
          statusFilter={listPanel.statusFilter}
          onFilterChange={listPanel.handleFilterChange}
          filterOpen={listPanel.filterOpen}
          onFilterToggle={listPanel.handleFilterToggle}
          onFilterClear={listPanel.handleFilterClear}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="editRequests"
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
            <Empty description="Select an edit request to view details" />
          </div>
        ) : (
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
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
