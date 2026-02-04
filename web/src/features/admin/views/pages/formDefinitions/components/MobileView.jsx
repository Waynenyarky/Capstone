import React from 'react'
import { Table, Button, Input, Typography } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { TABLE_MIN_WIDTH } from '../constants'
import FormStatsPieChart from './FormStatsPieChart'

const { Text } = Typography

export default function MobileView({
  displayStats,
  searchValue,
  setSearchValue,
  submitSearchNow,
  setFiltersOpen,
  industryRows,
  columns,
  loading,
  handleRowClick,
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* Summary card */}
      <div style={{ marginBottom: 16, padding: 16, background: 'var(--ant-color-bg-container)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            <FormStatsPieChart stats={displayStats} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong>{displayStats.activated}</Text>
              <Text type="secondary">active</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong>{displayStats.deactivated}</Text>
              <Text type="secondary">deactivated</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong>{displayStats.retired}</Text>
              <Text type="secondary">retired</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
        <Input.Search
          placeholder="Search form type or industry"
          allowClear
          style={{ width: '100%', minWidth: 0 }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={() => submitSearchNow()}
        />
        <Button type="text" icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)} aria-label="Filters" />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', minWidth: 0 }}>
        <Table
          bordered
          rowKey="industryScope"
          dataSource={industryRows}
          columns={columns}
          loading={loading}
          size="small"
          showHeader={false}
          scroll={{ x: TABLE_MIN_WIDTH }}
          pagination={false}
          onRow={(record) => ({ onClick: () => handleRowClick(record), style: { cursor: 'pointer' } })}
        />
      </div>
    </div>
  )
}
