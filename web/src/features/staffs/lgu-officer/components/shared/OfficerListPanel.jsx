import { useState, useMemo, useEffect } from 'react'
import { Empty, Input, Button, Tooltip, Select, Typography, theme, Pagination, Splitter } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import OfficerApplicationCard from '../../pages/applications/components/OfficerApplicationCard'

const { Text } = Typography

const PAGE_SIZE = 20

export default function OfficerListPanel({
  items,
  isLoading,
  search,
  onSearchChange,
  filterOptions,
  statusFilter,
  onFilterChange,
  filterOpen,
  onFilterToggle,
  onFilterClear,
  filterWrapperRef,
  activeTab,
  selectedItem,
  onItemClick,
  showWalkInButton = false,
  showRegisterButton = false,
  onWalkIn,
  onRegister,
  getItemId,
  detailPanel,
}) {
  const { token } = theme.useToken()
  const [page, setPage] = useState(1)

  const activeFilterCount = statusFilter ? 1 : 0

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  // Paginate items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return items.slice(start, end)
  }, [items, page])

  const listContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Search + filter + actions */}
      <div style={{ flexShrink: 0, padding: '12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', gap: 8, alignItems: 'center' }} ref={filterWrapperRef}>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{ flex: 1 }}
          />
          {filterOptions && filterOptions.length > 1 && (
            <Tooltip title="Filters">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={onFilterToggle}
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
                  onClick={onFilterToggle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <Select
                  placeholder="All statuses"
                  allowClear
                  value={statusFilter}
                  onChange={onFilterChange}
                  style={{ width: '100%' }}
                  options={filterOptions.filter(o => o.value !== 'all')}
                />
              </div>
              {activeFilterCount > 0 && (
                <Button size="small" type="link" onClick={onFilterClear} style={{ alignSelf: 'flex-start', padding: 0 }}>
                  Clear filter
                </Button>
              )}
            </div>
          )}
        </div>

        {showWalkInButton && (
          <Tooltip title="Walk-In Application">
            <Button type="primary" icon={<FormOutlined />} onClick={onWalkIn}>Walk-In</Button>
          </Tooltip>
        )}
        {showRegisterButton && (
          <Tooltip title="Register New Owner">
            <Button icon={<PlusOutlined />} onClick={onRegister}>Register</Button>
          </Tooltip>
        )}
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', paddingTop: 0 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><LottieSpinner /></div>
        ) : items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? 'No results' : 'No items'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginatedItems.map(item => {
              const id = getItemId(item)
              const itemType = activeTab === 'toReview' ? (item._itemType || 'business') : activeTab
              const itemKey = `${itemType}:${id}`
              return (
                <OfficerApplicationCard
                  key={itemKey}
                  item={item}
                  type={activeTab}
                  isSelected={selectedItem?._itemId === id && selectedItem?._itemType === itemType}
                  onClick={() => onItemClick(item)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
          Showing {paginatedItems.length} out of {items.length}
        </Text>
        <Pagination
          current={page}
          total={items.length}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          onChange={setPage}
          size="small"
        />
      </div>
    </div>
  )

  // If detailPanel is provided, use Splitter layout
  if (detailPanel !== undefined) {
    return (
      <Splitter style={{ height: '100%' }}>
        <Splitter.Panel min="25%" defaultSize="25%" style={{ overflow: 'hidden' }}>
          {listContent}
        </Splitter.Panel>
        <Splitter.Panel min="50%" defaultSize="75%" style={{ overflow: 'hidden' }}>
          {detailPanel || (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="Select an item to view details" />
            </div>
          )}
        </Splitter.Panel>
      </Splitter>
    )
  }

  // Otherwise, render list only
  return listContent
}
