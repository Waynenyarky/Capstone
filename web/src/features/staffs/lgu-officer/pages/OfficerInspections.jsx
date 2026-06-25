import { useState, useCallback, useMemo } from 'react'
import { Empty, Splitter } from 'antd'
import InspectionDetailPanel from '../components/InspectionDetailPanel'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending_assignment', label: 'Needs Assignment' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function OfficerInspections({ officerData, onReviewComplete }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'inspections' })

  const getItemId = useCallback((item) => {
    return item._id || item.inspectionId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.inspections || []

    if (listPanel.statusFilter) {
      list = list.filter(item => item.status === listPanel.statusFilter)
    }

    if (listPanel.search.trim()) {
      const q = listPanel.search.trim().toLowerCase()
      list = list.filter(item => {
        const name = (item.businessName || '').toLowerCase()
        const ref = (item._id || '').toLowerCase()
        return name.includes(q) || ref.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
  }, [officerData?.inspections, listPanel.statusFilter, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'inspections', _itemId: id })
  }, [getItemId])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.inspections}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={STATUS_FILTER_OPTIONS}
          statusFilter={listPanel.statusFilter}
          onFilterChange={listPanel.handleFilterChange}
          filterOpen={listPanel.filterOpen}
          onFilterToggle={listPanel.handleFilterToggle}
          onFilterClear={listPanel.handleFilterClear}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="inspections"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {!selectedItem ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select an inspection to view details" />
          </div>
        ) : (
          <InspectionDetailPanel inspection={selectedItem} onReviewComplete={onReviewComplete} />
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
