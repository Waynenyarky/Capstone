import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Typography, theme, Table, Tag, Spin } from 'antd'
import {
  ApiOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  CloudOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { getServicesHealth } from '../../../services'
import { getAllAuditLogsAdmin } from '../../../services'

const { Text } = Typography

const CARD_COLORS = {
  auth: '#1890ff',
  business: '#52c41a',
  admin: '#722ed1',
  audit: '#13c2c2',
  ai: '#eb2f96',
  mongodb: '#47a248',
  ipfs: '#13c2c2',
  pending: '#fa8c16',
  approved: '#52c41a',
  rejected: '#f5222d',
  on: '#52c41a',
  off: '#8c8c8c',
}

const ACTION_LABELS = {
  admin_approval_request: 'Request submitted',
  admin_approval_approved: 'Approved',
  admin_approval_rejected: 'Rejected',
  maintenance_mode: 'Maintenance mode',
}
const actionLabel = (eventType) => ACTION_LABELS[eventType] || eventType || '—'

export default function MaintenanceOverviewTab({
  current,
  approvals = [],
  setTabKey,
  onOpenRequestModal,
}) {
  const { token } = theme.useToken()
  const [services, setServices] = useState([])
  const [dependencies, setDependencies] = useState(null)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [recentLogs, setRecentLogs] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  const isActive = current?.isActive === true

  useEffect(() => {
    let cancelled = false
    getServicesHealth()
      .then((res) => {
        if (!cancelled) {
          setServices(res?.services || [])
          setDependencies(res?.dependencies ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServices([])
          setDependencies(null)
        }
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getAllAuditLogsAdmin({ limit: 10, eventType: 'maintenance_mode' })
      .then((res) => {
        if (!cancelled) setRecentLogs(res?.logs || [])
      })
      .catch(() => {
        if (!cancelled) setRecentLogs([])
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const approvalStats = useMemo(() => {
    const list = approvals || []
    return {
      pending: list.filter((a) => a.status === 'pending').length,
      approved: list.filter((a) => a.status === 'approved').length,
      rejected: list.filter((a) => a.status === 'rejected').length,
    }
  }, [approvals])

  const recentActivitySource = useMemo(() => {
    if (recentLogs.length > 0) return recentLogs
    const sorted = [...(approvals || [])].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    )
    return sorted.slice(0, 10)
  }, [recentLogs, approvals])

  const isAuditLog = (record) => record && record.eventType != null

  const cardGroups = [
    {
      title: 'Microservices status',
      cards: servicesLoading
        ? [{ key: 'loading', label: 'Loading…', value: null, icon: ApiOutlined }]
        : services.map((s) => ({
            key: s.key,
            label: s.name,
            value: s.status === 'up' ? 'Up' : s.status === 'degraded' ? 'Degraded' : 'Down',
            icon: s.key === 'ai' ? RobotOutlined : ApiOutlined,
            status: s.status,
          })),
    },
    ...(dependencies
      ? [
          {
            title: 'Infrastructure',
            cards: [
              {
                key: 'mongodb',
                label: 'MongoDB',
                value: dependencies.mongodb === 'connected' ? 'Connected' : 'Disconnected',
                icon: DatabaseOutlined,
                status: dependencies.mongodb === 'connected' ? 'up' : 'down',
                sub: 'Primary database (admin service)',
              },
              {
                key: 'ipfs',
                label: 'IPFS',
                value: dependencies.ipfs ? 'Available' : 'Unavailable',
                icon: CloudOutlined,
                status: dependencies.ipfs ? 'up' : 'down',
                sub: 'Document & file storage',
              },
            ],
          },
        ]
      : []),
    {
      title: 'Maintenance schedule',
      cards: [
        {
          key: 'mode',
          label: 'Maintenance mode',
          value: isActive ? 'On' : 'Off',
          icon: ToolOutlined,
          sub: isActive ? 'Non-admin users see maintenance page' : 'System running normally',
        },
        ...(isActive && current?.expectedResumeAt
          ? [
              {
                key: 'resume',
                label: 'Expected resume',
                value: dayjs(current.expectedResumeAt).format('MMM D, YYYY HH:mm'),
                icon: CalendarOutlined,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Maintenance requests',
      cards: [
        { key: 'pending', label: 'Pending', value: approvalStats.pending, icon: ClockCircleOutlined },
        { key: 'approved', label: 'Approved', value: approvalStats.approved, icon: CheckCircleOutlined },
        { key: 'rejected', label: 'Rejected', value: approvalStats.rejected, icon: CloseCircleOutlined },
      ],
    },
  ]

  const recentColumns = recentActivitySource.length > 0 && isAuditLog(recentActivitySource[0])
    ? [
        {
          title: 'Action',
          dataIndex: 'eventType',
          key: 'action',
          width: 160,
          render: (v) => <Tag>{actionLabel(v)}</Tag>,
        },
        {
          title: 'User',
          key: 'user',
          render: (_, r) => r.user || r.userEmail || '—',
        },
        {
          title: 'Performed by',
          dataIndex: 'performedBy',
          key: 'performedBy',
          render: (v) => v || '—',
        },
        {
          title: 'Date',
          dataIndex: 'createdAt',
          key: 'date',
          width: 160,
          render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—'),
        },
      ]
    : [
        {
          title: 'Action',
          key: 'action',
          width: 120,
          render: (_, r) => r.requestDetails?.action === 'enable' ? 'Enable' : 'Disable',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: (v) => (
            <Tag color={v === 'pending' ? 'gold' : v === 'approved' ? 'green' : 'red'} style={{ textTransform: 'capitalize' }}>{v}</Tag>
          ),
        },
        {
          title: 'Updated',
          key: 'date',
          width: 160,
          render: (_, r) =>
            dayjs(r.updatedAt || r.createdAt).format('MMM D, YYYY HH:mm'),
        },
      ]

  const onRowClick = (record) => {
    if (record && record.eventType != null && (record.id || record._id)) {
      const id = record.id || record._id
      window.location.href = `/admin/users?tab=logs&logId=${encodeURIComponent(id)}`
      return
    }
    if (record?.approvalId) setTabKey('requests')
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
        {cardGroups.map((group) => (
          <div key={group.title}>
            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15, color: token.colorText }}>
              {group.title}
            </Text>
            <Row gutter={[16, 16]} align="stretch">
              {group.cards.map(({ key, label, value, icon: Icon, status, sub }) => (
                <Col xs={24} sm={12} md={8} lg={6} key={key}>
                  <Card size="small" style={{ height: '100%' }}>
                    {key === 'loading' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Spin size="small" />
                        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: token.borderRadius,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background:
                                status === 'up'
                                  ? token.colorSuccess
                                  : status === 'degraded'
                                    ? token.colorWarning
                                    : status === 'down'
                                      ? token.colorError
                                      : CARD_COLORS[key] || token.colorPrimary,
                              color: '#fff',
                            }}
                          >
                            <Icon style={{ fontSize: 18 }} />
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>{value ?? '—'}</span>
                        </div>
                        {sub && (
                          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                            {sub}
                          </Text>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15, color: token.colorText }}>
              Recent activity
            </Text>
            {recentActivitySource.length > 0 && isAuditLog(recentActivitySource[0]) ? (
              <Link to="/admin/users?tab=logs">View all logs</Link>
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={() => setTabKey('requests')}
                onKeyDown={(e) => e.key === 'Enter' && setTabKey('requests')}
                style={{ color: token.colorPrimary, cursor: 'pointer' }}
              >
                View all requests
              </span>
            )}
          </div>
          <Card size="small">
            <Table
              size="small"
              dataSource={recentActivitySource}
              rowKey={(r) => r.approvalId || r.id || r._id || Math.random()}
              loading={recentLoading && recentLogs.length === 0}
              pagination={false}
              onRow={(record) => ({
                onClick: () => onRowClick(record),
                style: { cursor: 'pointer' },
              })}
              columns={recentColumns}
              locale={{ emptyText: 'No recent activity' }}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
