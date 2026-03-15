/**
 * EditRequestReviewPage
 * Staff page for reviewing and approving/rejecting business edit requests
 * Two-column layout matching PermitReviewPage pattern
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Form, Input, Space, Tag, Typography, Card,
  Select, Empty, Descriptions, Grid, theme, Splitter, Dropdown
} from 'antd'
import {
  EditOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, SearchOutlined, FilterOutlined, CloseOutlined,
  InboxOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, put } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

const STATUS_COLORS = {
  pending: 'processing',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
}

function EditRequestDetailPanel({ request, onReviewComplete, token }) {
  const [form] = Form.useForm()
  const [processing, setProcessing] = useState(false)
  const { success, error: notifyError } = useNotifier()

  const handleReview = useCallback(async (decision) => {
    if (!request) return
    try {
      setProcessing(true)
      const values = form.getFieldsValue()
      await put(`/api/business/edit-requests/${request._id}`, {
        status: decision,
        reviewNotes: values.reviewNotes,
      })
      success(`Edit request ${decision}`)
      form.resetFields()
      onReviewComplete?.()
    } catch (err) {
      notifyError(err, 'Failed to process edit request')
    } finally {
      setProcessing(false)
    }
  }, [request, form, success, notifyError, onReviewComplete])

  useEffect(() => {
    form.resetFields()
  }, [request, form])

  if (!request) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#8c8c8c',
        padding: 24
      }}>
        <InboxOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <Text type="secondary">Select an edit request to review</Text>
      </div>
    )
  }

  const isPending = request.status === 'pending' || request.status === 'submitted' || !request.status

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>Edit Request Details</Text>
      </div>

      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Business ID">
          <Text code>{request.businessId}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Field">
          <Text strong>{request.fieldName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Current Value">
          {request.currentValue || <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Value">
          <Text strong style={{ color: token.colorPrimary }}>{request.requestedValue}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Reason">
          {request.reason || <Text type="secondary">No reason provided</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[request.status] || 'default'}>
            {request.status || 'pending'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Submitted">
          {request.createdAt ? dayjs(request.createdAt).format('MMM D, YYYY h:mm A') : '—'}
        </Descriptions.Item>
      </Descriptions>

      {isPending && (
        <Card size="small" title="Review Decision" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Form.Item name="reviewNotes" label="Review Notes (Optional)">
              <TextArea rows={3} placeholder="Add notes about your decision..." />
            </Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('approved')}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={processing}
                onClick={() => handleReview('rejected')}
              >
                Reject
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {!isPending && request.reviewNotes && (
        <Card size="small" title="Review Notes">
          <Text>{request.reviewNotes}</Text>
        </Card>
      )}
    </div>
  )
}

export default function EditRequestReviewPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { token } = theme.useToken()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { error: notifyError } = useNotifier()

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/business/edit-requests', { role: 'staff' })
      const data = res?.data || []
      setRequests(data)
      setLastUpdated(new Date())
    } catch (err) {
      notifyError(err, 'Failed to load edit requests')
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Update selected request when list refreshes
  useEffect(() => {
    if (selectedRequest && requests?.length) {
      const updated = requests.find((r) => r._id === selectedRequest._id)
      if (updated) setSelectedRequest(updated)
      else setSelectedRequest(null)
    }
  }, [requests])

  const handleReviewComplete = async () => {
    await fetchRequests()
  }

  const filteredRequests = useMemo(() => {
    let list = requests || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) => {
        const businessId = (r?.businessId || '').toLowerCase()
        const fieldName = (r?.fieldName || '').toLowerCase()
        return businessId.includes(q) || fieldName.includes(q)
      })
    }
    if (statusFilter) {
      list = list.filter((r) => r?.status === statusFilter)
    }
    // Sort by date, newest first
    list.sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime()
      const dateB = new Date(b?.createdAt || 0).getTime()
      return dateB - dateA
    })
    return list
  }, [requests, search, statusFilter])

  const getStatusTag = (status) => {
    const label = status === 'submitted' ? 'pending' : status
    return <Tag color={STATUS_COLORS[status] || 'default'}>{label || 'pending'}</Tag>
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: 'Field',
      dataIndex: 'fieldName',
      key: 'fieldName',
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || 'N/A'}</Text>
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 80,
      render: (v) => v ? dayjs(v).format('MMM D') : '—',
    },
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 0 }}>
        <Input
          placeholder="Search business ID or field"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Dropdown
          open={filterOpen}
          onOpenChange={setFilterOpen}
          trigger={['click']}
          popupRender={() => (
            <div
              style={{
                padding: '16px 20px',
                background: '#fff',
                borderRadius: 10,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                minWidth: 200,
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
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                />
              </div>
              {statusFilter && (
                <Button size="small" onClick={() => setStatusFilter(null)}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        >
          <Button icon={<FilterOutlined />}>
            {statusFilter && <Tag color="blue" style={{ marginLeft: 4 }}>1</Tag>}
          </Button>
        </Dropdown>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <Table
          size="small"
          dataSource={filteredRequests}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="No edit requests" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          onRow={(record) => ({
            onClick: () => setSelectedRequest(record),
            style: {
              cursor: 'pointer',
              background: selectedRequest?._id === record._id ? token.colorPrimaryBg : undefined,
            },
          })}
        />
      </div>
    </div>
  )

  const headerActions = (
    <Space>
      {lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Last updated: {dayjs(lastUpdated).format('MMM D, h:mm A')}
        </Text>
      )}
      <Button
        icon={<ReloadOutlined />}
        onClick={fetchRequests}
        loading={loading}
      />
    </Space>
  )

  if (isMobile) {
    return (
      <StaffLayout
        pageTitle="Edit Requests"
        pageIcon={<EditOutlined />}
        headerActions={headerActions}
      >
        <div style={{ height: 'calc(100vh - 120px)' }}>
          {tableContent}
        </div>
      </StaffLayout>
    )
  }

  return (
    <StaffLayout
      pageTitle="Edit Requests"
      pageIcon={<EditOutlined />}
      headerActions={headerActions}
    >
      <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel min="25%" defaultSize="35%" style={{ overflow: 'hidden' }}>
            {tableContent}
          </Splitter.Panel>
          <Splitter.Panel min="40%" defaultSize="65%" style={{ overflow: 'hidden' }}>
            <EditRequestDetailPanel
              request={selectedRequest}
              onReviewComplete={handleReviewComplete}
              token={token}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    </StaffLayout>
  )
}
