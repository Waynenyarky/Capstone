import React from 'react'
import { Typography, Button, Select, Input } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { HISTORY_REASON_OPTIONS } from '../constants/maintenance.constants.js'

const { Text } = Typography

export default function MaintenanceFilterPanel({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  reasonFilter,
  onReasonChange,
  showAllRequests,
  onToggleShowAll,
  filterOpen,
  onToggleFilter,
  onClearFilters,
  activeFilterCount,
  onExport,
  exportDisabled,
  token,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      <Input
        placeholder="Search by requester, reason, message, or ID"
        prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
        allowClear
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Tooltip title="Filter">
        <Button
          icon={<FilterOutlined />}
          type={activeFilterCount > 0 ? 'primary' : 'default'}
          ghost={activeFilterCount > 0}
          onClick={onToggleFilter}
          aria-label="Toggle filters"
        />
      </Tooltip>
      <Tooltip title="Download filtered requests">
        <Button
          icon={<DownloadOutlined />}
          onClick={onExport}
          disabled={exportDisabled}
          aria-label="Download requests"
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
            background: token.colorBgElevated,
            borderRadius: 10,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: token.boxShadowSecondary,
            zIndex: 1000,
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: 13 }}>Filters</Text>
            <Button type="text" size="small" icon={<CloseOutlined style={{ fontSize: 12 }} />} onClick={onToggleFilter} aria-label="Close filters" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
            <Select
              placeholder="All statuses"
              allowClear
              value={statusFilter}
              onChange={onStatusChange}
              style={{ width: '100%' }}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved_upcoming', label: 'Approved - upcoming' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Reason</Text>
            <Select
              placeholder="All reasons"
              allowClear
              value={reasonFilter}
              onChange={onReasonChange}
              style={{ width: '100%' }}
              options={HISTORY_REASON_OPTIONS}
            />
          </div>
          <Button onClick={onToggleShowAll}>
            {showAllRequests ? 'Show default view' : 'Show all'}
          </Button>
          {activeFilterCount > 0 && (
            <Button size="small" type="link" onClick={onClearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
