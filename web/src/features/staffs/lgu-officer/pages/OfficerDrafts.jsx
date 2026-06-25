import { useState, useCallback, useMemo, useRef } from 'react'
import { Empty, Splitter } from 'antd'
import PermitApplicationForm from '@/features/business-owner/components/forms/PermitApplicationForm'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'
import { put } from '@/lib/http.js'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
]

export default function OfficerDrafts({ officerData, refresh, onCreateWalkIn }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'drafts' })
  const formRef = useRef(null)

  const getItemId = useCallback((item) => {
    return item.applicationId || item._id || item.businessId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.drafts || []

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
  }, [officerData?.drafts, listPanel.statusFilter, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'drafts', _itemId: id })
  }, [getItemId])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.drafts}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={STATUS_FILTER_OPTIONS}
          statusFilter={listPanel.statusFilter}
          onFilterChange={listPanel.handleFilterChange}
          filterOpen={listPanel.filterOpen}
          onFilterToggle={listPanel.handleFilterToggle}
          onFilterClear={listPanel.handleFilterClear}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="drafts"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
          showWalkInButton
          onWalkIn={onCreateWalkIn}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {!selectedItem ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select a draft to edit" />
          </div>
        ) : (
          <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PermitApplicationForm
              ref={formRef}
              embedded
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
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
