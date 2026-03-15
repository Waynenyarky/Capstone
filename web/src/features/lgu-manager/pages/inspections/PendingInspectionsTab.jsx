import React, { useState, useMemo, useEffect } from 'react'
import {
  Table, Input, Tag, Typography, Splitter, Empty, Pagination,
  Grid, theme, Button, Form, Select, DatePicker, TimePicker, message, Spin,
} from 'antd'
import { SearchOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography
const PAGE_SIZE = 20

export default function PendingInspectionsTab({
  unassignedBusinesses = [],
  inspectors = [],
  loading,
  onCreateInspection,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedBusinesses
    const q = search.trim().toLowerCase()
    return unassignedBusinesses.filter(
      (b) =>
        (b.businessName || '').toLowerCase().includes(q) ||
        (b.businessId || '').toLowerCase().includes(q)
    )
  }, [unassignedBusinesses, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  // Reset form when selection changes
  useEffect(() => {
    if (selected) {
      form.resetFields()
    }
  }, [selected, form])

  const inspectorOptions = useMemo(
    () =>
      inspectors.map((i) => ({
        value: i._id,
        label: `${i.name || i.email} (${i.email})`,
      })),
    [inspectors]
  )

  const columns = [
    { title: 'Business Name', key: 'name', ellipsis: true, render: (_, r) => r.businessName || 'Unknown' },
    { title: 'Business ID', dataIndex: 'businessId', key: 'id', width: 140, render: (v) => <Tag>{v}</Tag> },
  ]

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!selected) return
      setSubmitting(true)
      const payload = {
        inspectorId: values.inspectorId,
        businessProfileId: selected.businessProfileId,
        businessId: selected.businessId,
        permitType: values.permitType,
        inspectionType: values.inspectionType,
        scheduledDate: values.scheduledDate.toISOString(),
      }
      if (values.timeRange && values.timeRange.length === 2) {
        const base = values.scheduledDate.format('YYYY-MM-DD')
        payload.scheduledTimeWindow = {
          start: dayjs(`${base} ${values.timeRange[0].format('HH:mm')}`).toISOString(),
          end: dayjs(`${base} ${values.timeRange[1].format('HH:mm')}`).toISOString(),
        }
      }
      const ok = await onCreateInspection(payload)
      if (ok) {
        form.resetFields()
        setSelected(null)
      }
    } catch (e) {
      if (e?.errorFields) return
      message.error('Failed to assign inspection')
    } finally {
      setSubmitting(false)
    }
  }

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: 12, paddingBottom: 0 }}>
        <Input
          placeholder="Search by business name or ID"
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
            rowKey={(r) => `${r.businessProfileId}::${r.businessId}`}
            columns={columns}
            dataSource={paginated}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description="All businesses have inspections assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            rowClassName={(rec) => `${rec.businessProfileId}::${rec.businessId}` === (selected ? `${selected.businessProfileId}::${selected.businessId}` : '') ? 'pend-row-selected' : ''}
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
        .ant-table-tbody > tr.pend-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
      `}</style>
    </div>
  )

  const detailPanel = !selected ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
      <Empty
        image={<ShopOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        styles={{ image: { height: 60 } }}
        description={<Text type="secondary">Select a business to assign an inspection</Text>}
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
          <ShopOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {selected.businessName || 'Unknown'}
          </Typography.Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selected.businessId}
          </Text>
        </div>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
          Assign Inspection
        </Text>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="inspectorId"
            label="Inspector"
            rules={[{ required: true, message: 'Select an inspector' }]}
          >
            <Select
              placeholder="Select an active inspector"
              options={inspectorOptions}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="Scheduled Date"
            rules={[{ required: true, message: 'Select a date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
          <Form.Item name="timeRange" label="Time Window (optional)">
            <TimePicker.RangePicker format="h:mm A" use12Hours style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="permitType"
            label="Permit Type"
            rules={[{ required: true }]}
            initialValue="initial"
          >
            <Select
              options={[
                { value: 'initial', label: 'Initial' },
                { value: 'renewal', label: 'Renewal' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="inspectionType"
            label="Inspection Type"
            rules={[{ required: true }]}
            initialValue="initial"
          >
            <Select
              options={[
                { value: 'initial', label: 'Initial' },
                { value: 'renewal', label: 'Renewal' },
                { value: 'follow_up', label: 'Follow-up' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              loading={submitting}
            >
              Assign Inspection
            </Button>
          </Form.Item>
        </Form>
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
