import { useState, useCallback, useMemo } from 'react'
import { Empty, Splitter } from 'antd'
import LogDetailPanel from '../components/LogDetailPanel'
import OfficerListPanel from '../components/shared/OfficerListPanel'
import useOfficerListPanel from '../hooks/useOfficerListPanel'

export default function OfficerLogs({ officerData }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const listPanel = useOfficerListPanel({ activeTab: 'logs' })

  const getItemId = useCallback((item) => {
    return item._id
  }, [])

  const filteredList = useMemo(() => {
    let list = officerData?.logs || []

    if (listPanel.search.trim()) {
      const q = listPanel.search.trim().toLowerCase()
      list = list.filter(item => {
        const eventType = (item.eventType || item.action || '').toLowerCase()
        const details = (item.details || item.metadata?.description || '').toLowerCase()
        return eventType.includes(q) || details.includes(q)
      })
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })
  }, [officerData?.logs, listPanel.search])

  const handleItemClick = useCallback((item) => {
    const id = getItemId(item)
    setSelectedItem({ ...item, _itemType: 'logs', _itemId: id })
  }, [getItemId])

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
        <OfficerListPanel
          items={filteredList}
          isLoading={officerData?.loadingMap?.logs}
          search={listPanel.search}
          onSearchChange={listPanel.handleSearchChange}
          filterOptions={null}
          statusFilter={null}
          onFilterChange={() => {}}
          filterOpen={false}
          onFilterToggle={() => {}}
          onFilterClear={() => {}}
          filterWrapperRef={listPanel.filterWrapperRef}
          activeTab="logs"
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          getItemId={getItemId}
        />
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
        {!selectedItem ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select a log entry to view details" />
          </div>
        ) : (
          <LogDetailPanel log={selectedItem} />
        )}
      </Splitter.Panel>
    </Splitter>
  )
}
