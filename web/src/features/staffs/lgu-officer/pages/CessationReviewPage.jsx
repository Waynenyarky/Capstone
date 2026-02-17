import React, { useState, useEffect, useCallback } from 'react'
import {
  Table, Card, Button, Modal, Space, Tag, Typography, Select,
  Input, Spin, Alert, Descriptions, message, Empty, Grid
} from 'antd'
import {
  StopOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, SearchOutlined, ReloadOutlined
} from '@ant-design/icons'
import StaffLayout from '../../components/StaffLayout.jsx'
import { get, post } from '@/lib/http.js'
import { useNotifier } from '@/shared/notifications.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { useBreakpoint } = Grid

export default function CessationReviewPage() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [loading, setLoading] = useState(true)
  const [retirements, setRetirements] = useState([])
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [detailModal, setDetailModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const { success, error: notifyError } = useNotifier()

  const fetchRetirements = useCallback(async () => {
    try {
      setLoading(true)
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await get('/api/business/retirements', params)
      setRetirements(res?.data || [])
    } catch (err) {
      notifyError(err, 'Failed to load retirement applications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, notifyError])

  useEffect(() => { fetchRetirements() }, [fetchRetirements])

  const handleAction = useCallback(async (businessId, action, rejectionReason) => {
    try {
      setActionLoading(true)
      if (action === 'verify') {
        await post(`/api/business/${businessId}/retire/verify`, { verified: true })
        success('Business closure verified by inspector')
      } else if (action === 'confirm') {
        await post(`/api/business/${businessId}/retire/confirm`)
        success('Retirement confirmed')
      } else if (action === 'reject') {
        await post(`/api/business/${businessId}/retire/verify`, {
          verified: false,
          rejectionReason: rejectionReason || 'Rejected by officer',
        })
        success('Retirement application rejected')
      }
      setDetailModal(null)
      setRejectionReason('')
      fetchRetirements()
    } catch (err) {
      notifyError(err, 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }, [success, notifyError, fetchRetirements])

  const getStatusTag = (status) => {
    const map = {
      requested: { color: 'processing', text: 'Requested' },
      inspector_verified: { color: 'warning', text: 'Inspector Verified' },
      confirmed: { color: 'success', text: 'Confirmed' },
      rejected: { color: 'error', text: 'Rejected' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    { title: 'Business Name', dataIndex: 'businessName', key: 'businessName' },
    { title: 'Business ID', dataIndex: 'businessId', key: 'businessId', render: (v) => <Text code>{v}</Text> },
    { title: 'Status', dataIndex: 'retirementStatus', key: 'status', render: getStatusTag },
    {
      title: 'Requested At',
      dataIndex: 'retirementRequestedAt',
      key: 'requestedAt',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    { title: 'Years Active', dataIndex: 'yearsActive', key: 'yearsActive' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(record)}>
          Review
        </Button>
      ),
    },
  ]

  return (
    <StaffLayout>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <Title level={3}>
          <StopOutlined style={{ marginRight: 8 }} />
          Cessation / Retirement Review
        </Title>

        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="Filter by status"
              style={{ width: 200 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="requested">Requested</Select.Option>
              <Select.Option value="inspector_verified">Inspector Verified</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchRetirements} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Card>

        <Table
          aria-label="Retirement applications"
          dataSource={retirements}
          columns={columns}
          rowKey="businessId"
          loading={loading}
          locale={{ emptyText: <Empty description="No retirement applications" /> }}
          scroll={{ x: 'max-content' }}
        />

        <Modal
          title="Retirement Application Details"
          open={!!detailModal}
          onCancel={() => { setDetailModal(null); setRejectionReason('') }}
          footer={null}
          width={isMobile ? '95%' : 600}
        >
          {detailModal && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Business">{detailModal.businessName}</Descriptions.Item>
                <Descriptions.Item label="Business ID">{detailModal.businessId}</Descriptions.Item>
                <Descriptions.Item label="Status">{getStatusTag(detailModal.retirementStatus)}</Descriptions.Item>
                <Descriptions.Item label="Requested">
                  {detailModal.retirementRequestedAt ? dayjs(detailModal.retirementRequestedAt).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Years Active">{detailModal.yearsActive || '-'}</Descriptions.Item>
                <Descriptions.Item label="Gross Sales (Sworn)">
                  ₱{(detailModal.swornStatementGrossSales || 0).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Inspector Verified">
                  {detailModal.inspectorVerifiedClosed ? 'Yes' : 'No'}
                </Descriptions.Item>
              </Descriptions>

              {detailModal.retirementStatus === 'requested' && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    rows={3}
                    placeholder="Enter rejection reason (required to reject)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleAction(detailModal.businessId, 'verify')}
                      loading={actionLoading}
                    >
                      Verify Closure (Inspector)
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleAction(detailModal.businessId, 'reject', rejectionReason)}
                      loading={actionLoading}
                      disabled={!rejectionReason.trim()}
                    >
                      Reject
                    </Button>
                  </Space>
                </Space>
              )}

              {detailModal.retirementStatus === 'inspector_verified' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction(detailModal.businessId, 'confirm')}
                  loading={actionLoading}
                  block
                >
                  Confirm Retirement
                </Button>
              )}
            </Space>
          )}
        </Modal>
      </div>
    </StaffLayout>
  )
}
