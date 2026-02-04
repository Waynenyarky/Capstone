import React from 'react'
import { Space, Select, Typography } from 'antd'

const { Text } = Typography

export default function FilterDropdownContent({
  filters,
  onFilterChange,
  formTypes,
  industryOptions,
  statusOptions,
}) {
  const statusValue = filters.includeRetired ? 'all' : 'active'

  return (
    <div style={{ padding: 12, minWidth: 260, background: 'var(--ant-color-bg-elevated)', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Type</Text>
          <Select
            placeholder="All types"
            allowClear
            style={{ width: '100%' }}
            value={filters.formType || undefined}
            onChange={(v) => onFilterChange('formType', v || '')}
            options={formTypes}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Industry</Text>
          <Select
            placeholder="All industries"
            allowClear
            style={{ width: '100%' }}
            value={filters.industryScope || undefined}
            onChange={(v) => onFilterChange('industryScope', v || '')}
            options={industryOptions}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Status</Text>
          <Select
            style={{ width: '100%' }}
            value={statusValue}
            onChange={(v) => onFilterChange('includeRetired', v === 'all')}
            options={statusOptions}
          />
        </div>
      </Space>
    </div>
  )
}
