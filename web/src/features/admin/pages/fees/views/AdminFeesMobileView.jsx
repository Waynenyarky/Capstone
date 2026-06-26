import { useRef, useEffect, useMemo } from 'react'
import { Typography, Select, theme, Row, Empty, Input, Button, Tooltip, Drawer, Space, Tag } from 'antd'
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

export default function AdminFeesMobileView() {
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

  const { paginatedData } = useFeesPagination(filteredItems, PAGE_SIZE)

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

  const rightPanelContent = selectedItemId ? (
    <>
      {selectedType === 'fee_groups' && selectedItem && (
        <FeeGroupDetailPanel
          groupId={selectedItemId}
          group={selectedItemId === 'new' ? null : selectedItem}
          availableFees={fees}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
          isMobile={true}
        />
      )}
      {selectedType === 'fees' && selectedItem && (
        <FeeDetailPanel
          feeId={selectedItemId}
          fee={selectedItemId === 'new' ? null : selectedItem}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
          isMobile={true}
        />
      )}
      {selectedType === 'penalty_rules' && selectedItem && (
        <PenaltyRuleDetailPanel
          ruleId={selectedItemId}
          rule={selectedItemId === 'new' ? null : selectedItem}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
          isMobile={true}
        />
      )}
      {selectedType === 'appeal_fees' && selectedItem && (
        <FeeDetailPanel
          feeId={selectedItemId}
          fee={selectedItemId === 'new' ? null : selectedItem}
          onSave={refresh}
          onDelete={() => {
            onDelete(selectedItemId)
            setSelectedItemId(null)
          }}
          isMobile={true}
        />
      )}
    </>
  ) : null

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Select
        value={selectedType}
        onChange={(value) => {
          setSelectedType(value)
          setStatusFilter('')
        }}
        style={{ width: '100%' }}
        options={FEE_TYPES}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
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
      {paginatedData.length === 0 ? (
        <Empty description="No items found" />
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
      <Drawer
        open={!!selectedItemId}
        onClose={() => onSelectItem(null)}
        title={
          <Space>
            <span>
              {(() => {
                if (selectedItemId === 'new') {
                  if (selectedType === 'fee_groups') return 'New Fee Group'
                  if (selectedType === 'fees') return 'New Fee'
                  if (selectedType === 'penalty_rules') return 'New Penalty Rule'
                  if (selectedType === 'appeal_fees') return 'New Appeal Fee'
                  return 'New'
                }
                if (selectedType === 'fee_groups') return 'Fee Group Detail'
                if (selectedType === 'fees') return 'Fee Detail'
                if (selectedType === 'penalty_rules') return 'Penalty Rule Detail'
                if (selectedType === 'appeal_fees') return 'Appeal Fee Detail'
                return 'Detail'
              })()}
            </span>
            {selectedItemId !== 'new' && (
              <Tag
                color="success"
                style={{ fontWeight: 'normal' }}
              >
                Saved
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width="100%"
        styles={{
          body: { padding: 0 }
        }}
      >
        {rightPanelContent}
      </Drawer>
    </div>
  )
}
