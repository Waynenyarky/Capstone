import { useEffect, useRef } from 'react'
import { Button, Card, Empty, Input, Pagination, Select, Tag, Tooltip, Typography, theme } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { CloseOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { PRIORITY_COLORS, STATUS_COLORS, ANNOUNCEMENT_STATUS_OPTIONS, ANNOUNCEMENT_PRIORITY_OPTIONS } from '../constants/announcements.constants.js'
import { getAnnouncementTitle } from '../utils/announcements.utils.js'

const { Text } = Typography

export default function AnnouncementList({
  announcements,
  loading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filterOpen,
  onToggleFilter,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  activeFilterCount,
  onClearFilters,
  currentPage,
  onPageChange,
  totalCount,
  pageSize,
  onKeyDown,
}) {
  const { token } = theme.useToken()
  const filterWrapperRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return

    const handleClickOutside = (event) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target)) {
        const isSelectDropdown = event.target.closest('.ant-select-dropdown')
        if (!isSelectDropdown) onToggleFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen, onToggleFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer }}>
      <div style={{ flexShrink: 0, padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search announcements..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <div style={{ position: 'relative' }} ref={filterWrapperRef}>
          <Tooltip title="Filter announcements">
            <Button
              icon={<FilterOutlined />}
              type={activeFilterCount > 0 ? 'primary' : 'default'}
              ghost={activeFilterCount > 0}
              onClick={() => onToggleFilter(!filterOpen)}
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
                  onClick={() => onToggleFilter(false)}
                  aria-label="Close filters"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                <Select
                  placeholder="All statuses"
                  allowClear
                  value={statusFilter}
                  onChange={onStatusChange}
                  style={{ width: '100%' }}
                  options={ANNOUNCEMENT_STATUS_OPTIONS}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Priority</Text>
                <Select
                  placeholder="All priorities"
                  allowClear
                  value={priorityFilter}
                  onChange={onPriorityChange}
                  style={{ width: '100%' }}
                  options={ANNOUNCEMENT_PRIORITY_OPTIONS}
                />
              </div>
              {activeFilterCount > 0 && (
                <Button size="small" type="link" onClick={onClearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0, padding: '12px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <LottieSpinner />
            </div>
          ) : announcements.length === 0 ? (
            <Empty description="No announcements found" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {announcements.map((record) => {
                const isSelected = selectedId === record._id
                return (
                  <Card
                    key={record._id}
                    size="small"
                    hoverable
                    onClick={() => onSelect(record)}
                    onKeyDown={(event) => onKeyDown(event, record)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select announcement: ${getAnnouncementTitle(record)}`}
                    styles={{
                      header: { padding: '12px 16px' },
                      body: { padding: '12px 16px' },
                    }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      border: isSelected ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                      background: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
                    }}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <Text strong style={{ fontSize: 14, display: 'block' }}>
                          {getAnnouncementTitle(record)}
                        </Text>
                        <Tag color={STATUS_COLORS[record.status] || 'default'} style={{ margin: 0 }}>
                          {(record.status || 'draft').toUpperCase()}
                        </Tag>
                      </div>
                    }
                    extra={
                      <Tag color={PRIORITY_COLORS[record.priority] || 'default'} style={{ margin: 0 }}>
                        {(record.priority || 'normal').toUpperCase()}
                      </Tag>
                    }
                  >
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      {record.body?.substring(0, 100) || 'No content'}{record.body?.length > 100 ? '…' : ''}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Created {record.createdAt ? dayjs(record.createdAt).format('MMM D, YYYY') : '-'}
                      </Text>
                      {record.updatedAt && record.updatedAt !== record.createdAt && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Updated {dayjs(record.updatedAt).format('MMM D, YYYY')}
                        </Text>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Pagination
            current={currentPage}
            total={totalCount}
            pageSize={pageSize}
            showSizeChanger={false}
            onChange={onPageChange}
            size="small"
          />
        </div>
      </div>
    </div>
  )
}
