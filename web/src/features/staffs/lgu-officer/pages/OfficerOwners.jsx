import { useState, useCallback, useMemo } from 'react'
import { Empty, Splitter } from 'antd'
import BusinessOwnerDetailPanel from '../components/BusinessOwnerDetailPanel'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'

export default function OfficerOwners({ officerData, onCreateWalkIn, onRegisterOwner }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'owners' })

  const getItemId = useCallback((item) => {
    return item._id || item.userId
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.owners || []

    if (listPanel.search.trim()) {
      const q = listPanel.search.trim().toLowerCase()
      list = list.filter(item => {
        const name = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase()
        const email = (item.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })
  }, [officerData?.owners, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'owners', _itemId: id })
  }, [getItemId])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.owners}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={null}
          statusFilter={null}
          onFilterChange={() => {}}
          filterOpen={false}
          onFilterToggle={() => {}}
          onFilterClear={() => {}}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="owners"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
          showRegisterButton
          onRegister={onRegisterOwner}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {!selectedItem ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select an owner to view details" />
          </div>
        ) : (
          <BusinessOwnerDetailPanel
            owner={selectedItem}
            onCreateWalkIn={onCreateWalkIn}
            onEditOwner={() => {}}
          />
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
