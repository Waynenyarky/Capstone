import React, { useState, useMemo, useEffect } from 'react'
import {
  Table, Input, Tag, Typography, Splitter, Empty, Pagination,
  Grid, theme, Descriptions,
} from 'antd'
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography
const PAGE_SIZE = 20

const RESULT_COLORS = {
  passed: 'success',
  failed: 'error',
  needs_reinspection: 'warning',
}

export default function CompletedInspectionsTab({ completedInspections = [], loading }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (selected && completedInspections.length) {
      const updated = completedInspections.find((c) => c._id === selected._id)
      if (updated) setSelected(updated)
      else setSelected(null)
    }
  }, [completedInspections])

  const filtered = useMemo(() => {
    if (!search.trim()) return completedInspections
    const q = search.trim().toLowerCase()
    return completedInspections.filter(
      (c) =>
        (c.businessName || '').toLowerCase().includes(q) ||
        (c.inspectorName || '').toLowerCase().includes(q) ||
        (c.businessId || '').toLowerCase().includes(q)
    )
  }, [completedInspections, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  const columns = [
    {
      title: 'Result', key: 'result', width: 120,
      render: (_, r) => {
        if (!r.overallResult) return <Tag>—</Tag>
        return <Tag color={RESULT_COLORS[r.overallResult] || 'default'}>{(r.overallResult || '').replace('_', ' ')}</Tag>
      },
    },
    { title: 'Business', key: 'name', ellipsis: true, render: (_, r) => r.businessName || r.businessId || 'Unknown' },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', width: 140, render: (v) => v || '—' },
    {
      title: 'Scheduled', dataIndex: 'scheduledDate', key: 'date', width: 110,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY') : '—',
    },
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <Input
          placeholder="Search by business or inspector"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <Table
            size="small"
            rowKey="_id"
            columns={columns}
            dataSource={paginated}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="No completed inspections" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            rowClassName={(rec) => rec?._id === selected?._id ? 'comp-row-selected' : ''}
            onRow={(rec) => ({
              onClick: () => setSelected(rec),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end', paddingRight: 12 }}>
          <Pagination
            current={currentPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.comp-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
      `}</style>
    </div>
  )

  const detailPanel = !selected ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
      <Empty
        image={<CheckCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        styles={{ image: { height: 60 } }}
        description={<Text type="secondary">Select a completed inspection to view details</Text>}
      />
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div
        style={{
          flexShrink: 0, padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span
          style={{
            width: 32, height: 32, borderRadius: token.borderRadius,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: token.colorFillTertiary, color: token.colorPrimary, flexShrink: 0,
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {selected.businessName || selected.businessId || 'Unknown'}
          </Typography.Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selected.overallResult ? (
              <Tag color={RESULT_COLORS[selected.overallResult] || 'default'} style={{ marginRight: 4 }}>
                {(selected.overallResult || '').replace('_', ' ')}
              </Tag>
            ) : '—'}
            {selected.inspectionType?.replace('_', ' ') || ''}
          </Text>
        </div>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500, width: 140 }}>
          <Descriptions.Item label="Business ID">
            <Text code>{selected.businessId || '—'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Inspector">
            {selected.inspectorName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Permit Type">
            {selected.permitType || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Inspection Type">
            {selected.inspectionType?.replace('_', ' ') || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Scheduled Date">
            {selected.scheduledDate ? dayjs(selected.scheduledDate).format('MMMM D, YYYY') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Overall Result">
            {selected.overallResult ? (
              <Tag color={RESULT_COLORS[selected.overallResult] || 'default'}>
                {(selected.overallResult || '').replace('_', ' ')}
              </Tag>
            ) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned By">
            {selected.assignedBy || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned At">
            {selected.assignedAt ? dayjs(selected.assignedAt).format('MMM D, YYYY h:mm A') : '—'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  )

  if (isMobile) return tableContent

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="40%" style={{ overflow: 'hidden' }}>
        {tableContent}
      </Splitter.Panel>
      <Splitter.Panel min="40%" defaultSize="60%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {detailPanel}
      </Splitter.Panel>
    </Splitter>
  )
}
