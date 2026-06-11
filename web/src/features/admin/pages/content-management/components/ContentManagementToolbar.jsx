import { Input, Button, Tooltip, Select, Typography } from 'antd'
import { SearchOutlined, FilterOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function ContentManagementToolbar({
  searchValue,
  onSearchChange,
  onToggleFilter,
  activeFilterCount,
  onAdd,
  showAddButton,
  addButtonLabel,
  token,
  filterOpen,
  filterWrapperRef,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  clearFilters,
  showFilters = true,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <Input
        placeholder="Search..."
        prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
        allowClear
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
      {showFilters && (
        <div style={{ position: 'relative' }} ref={filterWrapperRef}>
          <Tooltip title="Filter">
            <Button
              icon={<FilterOutlined />}
              type={activeFilterCount > 0 ? 'primary' : 'default'}
              ghost={activeFilterCount > 0}
              onClick={onToggleFilter}
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
                  onClick={onToggleFilter}
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
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Priority</Text>
                <Select
                  placeholder="All priorities"
                  allowClear
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'high', label: 'High' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Low' },
                  ]}
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
      )}
      {showAddButton && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          {addButtonLabel || 'New'}
        </Button>
      )}
    </div>
  )
}
