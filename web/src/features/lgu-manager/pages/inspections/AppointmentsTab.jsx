import { useState, useMemo, useEffect } from 'react'
import {
  Table, Input, Tag, Typography, Splitter, Empty, Pagination,
  Grid, theme, Button, Descriptions, Modal, DatePicker, TimePicker, Form, message,
} from 'antd'
import {
  SearchOutlined, CalendarOutlined, SwapOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography
const PAGE_SIZE = 20

const STATUS_COLORS = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
}

export default function AppointmentsTab({
  appointments = [],
  inspectors = [],
  loading,
  onReschedule,
  highlightId,
  clearHighlightId,
}) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleForm] = Form.useForm()
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  // Auto-select highlighted appointment from calendar
  useEffect(() => {
    if (highlightId && appointments.length) {
      const found = appointments.find((a) => a._id === highlightId)
      if (found) setSelected(found)
      clearHighlightId?.()
    }
  }, [highlightId, appointments, clearHighlightId])

  // Keep selected in sync with data refreshes
  useEffect(() => {
    if (selected && appointments.length) {
      const updated = appointments.find((a) => a._id === selected._id)
      if (updated) setSelected(updated)
      else setSelected(null)
    }
  }, [appointments])

  const filtered = useMemo(() => {
    if (!search.trim()) return appointments
    const q = search.trim().toLowerCase()
    return appointments.filter(
      (a) =>
        (a.businessName || '').toLowerCase().includes(q) ||
        (a.inspectorName || '').toLowerCase().includes(q) ||
        (a.businessId || '').toLowerCase().includes(q)
    )
  }, [appointments, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  const columns = [
    {
      title: 'Status', key: 'status', width: 100,
      render: (_, r) => <Tag color={STATUS_COLORS[r.status] || 'default'}>{(r.status || '').replace('_', ' ')}</Tag>,
    },
    { title: 'Business', key: 'name', ellipsis: true, render: (_, r) => r.businessName || r.businessId || 'Unknown' },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', width: 140, render: (v) => v || <Text type="secondary">—</Text> },
    {
      title: 'Scheduled', dataIndex: 'scheduledDate', key: 'date', width: 110,
      render: (v) => v ? dayjs(v).format('MMM D, YYYY') : '—',
    },
  ]

  const handleRescheduleSubmit = async () => {
    try {
      const values = await rescheduleForm.validateFields()
      if (!selected?._id) return
      setRescheduleLoading(true)
      const payload = {
        scheduledDate: values.date.toISOString(),
        reason: values.reason || undefined,
      }
      if (values.timeRange && values.timeRange.length === 2) {
        const base = values.date.format('YYYY-MM-DD')
        payload.scheduledTimeWindow = {
          start: dayjs(`${base} ${values.timeRange[0].format('HH:mm')}`).toISOString(),
          end: dayjs(`${base} ${values.timeRange[1].format('HH:mm')}`).toISOString(),
        }
      }
      const ok = await onReschedule(selected._id, payload)
      if (ok) {
        setRescheduleOpen(false)
        rescheduleForm.resetFields()
      }
    } catch (e) {
      if (e?.errorFields) return
      message.error('Reschedule failed')
    } finally {
      setRescheduleLoading(false)
    }
  }

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
            locale={{ emptyText: <Empty description="No appointments" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            rowClassName={(rec) => rec?._id === selected?._id ? 'insp-row-selected' : ''}
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
        .ant-table-tbody > tr.insp-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
      `}</style>
    </div>
  )

  const detailPanel = !selected ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
      <Empty
        image={<CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        styles={{ image: { height: 60 } }}
        description={<Text type="secondary">Select an appointment to view details</Text>}
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
          <CalendarOutlined style={{ fontSize: 16 }} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
            {selected.businessName || selected.businessId || 'Unknown'}
          </Typography.Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <Tag color={STATUS_COLORS[selected.status] || 'default'} style={{ marginRight: 4 }}>
              {(selected.status || '').replace('_', ' ')}
            </Tag>
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
          {selected.scheduledTimeWindow?.start && (
            <Descriptions.Item label="Time Window">
              {dayjs(selected.scheduledTimeWindow.start).format('h:mm A')} – {dayjs(selected.scheduledTimeWindow.end).format('h:mm A')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Assigned By">
            {selected.assignedBy || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned At">
            {selected.assignedAt ? dayjs(selected.assignedAt).format('MMM D, YYYY h:mm A') : '—'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Button
            icon={<SwapOutlined />}
            onClick={() => {
              rescheduleForm.setFieldsValue({
                date: selected.scheduledDate ? dayjs(selected.scheduledDate) : undefined,
                timeRange: selected.scheduledTimeWindow?.start
                  ? [dayjs(selected.scheduledTimeWindow.start), dayjs(selected.scheduledTimeWindow.end)]
                  : undefined,
                reason: '',
              })
              setRescheduleOpen(true)
            }}
          >
            Reschedule
          </Button>
        </div>
      </div>

      <Modal
        title="Reschedule Inspection"
        open={rescheduleOpen}
        onCancel={() => setRescheduleOpen(false)}
        onOk={handleRescheduleSubmit}
        confirmLoading={rescheduleLoading}
        okText="Reschedule"
        destroyOnHidden
      >
        <Form form={rescheduleForm} layout="vertical">
          <Form.Item
            name="date"
            label="New Date"
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
          <Form.Item name="reason" label="Reason (optional)">
            <Input.TextArea rows={2} placeholder="Reason for rescheduling" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {tableContent}
      </div>
    )
  }

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
