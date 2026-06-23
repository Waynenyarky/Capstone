import { useRef, useEffect, useMemo } from 'react'
import { Typography, Select, theme, Row, Splitter, Pagination, Empty, Input, Button, Tooltip } from 'antd'
import { SearchOutlined, PlusOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'

import FeeGroupDetailPanel from '../components/FeeGroupDetailPanel'
import FeeDetailPanel from '../components/FeeDetailPanel'
import PenaltyRuleDetailPanel from '../components/PenaltyRuleDetailPanel'
import FeeCard from '../components/FeeCard'

import { FEE_TYPES, STATUS_OPTIONS, PAGE_SIZE } from '../constants/fees.constants'
import { filterItemsBySearch, filterItemsByStatus } from '../utils/fees.utils'
import { useFees } from '../hooks/useFees'
import { useFeesFilters } from '../hooks/useFeesFilters'
import { useFeesPagination } from '../hooks/useFeesPagination'

const { Text } = Typography

export default function AdminFeesDesktopView() {
  const { token } = theme.useToken()
  const filterWrapperRef = useRef(null)

  const {
    selectedType,
    setSelectedType,
    selectedItemId,
    setSelectedItemId,
    items,
    selectedItem,
    addButtonLabel,
    onSelectItem,
    onAddNew,
    onDelete,
    refresh,
    fees,
  } = useFees()

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filterOpen,
    setFilterOpen,
    clearFilters,
    activeFilterCount,
  } = useFeesFilters()

  const filteredItems = useMemo(() => {
    let result = items
    result = filterItemsBySearch(result, searchTerm)
    result = filterItemsByStatus(result, statusFilter)
    return result
  }, [items, searchTerm, statusFilter])

  const { page, setPage, paginatedData, total } = useFeesPagination(filteredItems, PAGE_SIZE)

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

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
  }, [filterOpen, setFilterOpen])

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Select
          value={selectedType}
          onChange={(value) => {
            setSelectedType(value)
            setStatusFilter('')
          }}
          style={{ width: '100%' }}
          options={FEE_TYPES}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={filterWrapperRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen((prev) => !prev)}
                aria-label="Toggle filters"
              />
            </Tooltip>

            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: '16px 20px',
                  background: '#fff',
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  zIndex: 1000,
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
                    aria-label="Close filters"
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
                    options={STATUS_OPTIONS}
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddNew}>
            {addButtonLabel}
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: 12 }}>
        <div style={{ overflow: 'auto', flex: 1, minHeight: 0, paddingRight: 12, paddingBottom: 12, paddingLeft: 12 }}>
          {paginatedData.length === 0 ? (
            <Empty description="No items found" style={{ marginTop: 24 }} />
          ) : (
            <Row gutter={[12, 12]}>
              {paginatedData.map((item) => (
                <FeeCard
                  key={item._id}
                  item={item}
                  selectedId={selectedItemId}
                  selectedType={selectedType}
                  token={token}
                  onSelect={onSelectItem}
                />
              ))}
            </Row>
          )}
        </div>
        <div style={{ padding: '12px 12px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {startItem}-{endItem} of {total}
          </Text>
          <Pagination
            current={page}
            total={total}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )

  const rightPanelContent = selectedItemId ? (
    <>
      {selectedType === 'fee_groups' && (
        <FeeGroupDetailPanel
          groupId={selectedItemId}
          group={selectedItemId === 'new' ? null : selectedItem}
          availableFees={fees}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
        />
      )}
      {selectedType === 'fees' && (
        <FeeDetailPanel
          feeId={selectedItemId}
          fee={selectedItemId === 'new' ? null : selectedItem}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
        />
      )}
      {selectedType === 'penalty_rules' && (
        <PenaltyRuleDetailPanel
          ruleId={selectedItemId}
          rule={selectedItemId === 'new' ? null : selectedItem}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
        />
      )}
    </>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">Select an item to view details</Text>
      </div>
    </div>
  )

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {leftPanelContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanelContent}
      </Splitter.Panel>
    </Splitter>
  )
}
