import { useMemo, useState, useEffect } from 'react'
import { Row, Col, Card, Typography, theme, Table, Tag, Empty } from 'antd'
import {
  UserAddOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  StopOutlined,
  ShopOutlined,
  AuditOutlined,
  IdcardOutlined,
  CrownOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'

import { getStaffStatus } from './useAdminUsersPage'
import { useUsersTable } from '@/features/admin/users/hooks/useUsersTable'
import { getAllAuditLogsAdmin } from '../../services'
import dayjs from 'dayjs'

const { Text } = Typography

const ACTION_LABELS = {
  profile_update: 'Profile updated',
  password_change: 'Password changed',
  admin_approval_approved: 'Approval granted',
  admin_approval_rejected: 'Rejected',
  name_update: 'Name updated',
  contact_update: 'Contact updated',
  security_event: 'Security event',
}
const actionLabel = (eventType) => ACTION_LABELS[eventType] || eventType || '—'

const CARD_COLORS = {
  pending: '#fa8c16',
  disabled: '#f5222d',
  totalStaff: '#1890ff',
  recent: '#13c2c2',
  businessOwners: '#eb2f96',
  recentBO: '#52c41a',
  inspectors: '#faad14',
  officers: '#389e0d',
  managers: '#722ed1',
  admins: '#531dab',
}

export default function OverviewTab({ staff = [] }) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { users = [] } = useUsersTable()
  const [recentLogs, setRecentLogs] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllAuditLogsAdmin({ limit: 10 })
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

  const businessOwners = useMemo(() => {
    return (users || []).filter((u) => u?.role === 'business_owner')
  }, [users])

  const stats = useMemo(() => {
    const getRoleSlug = (s) => (typeof s?.role === 'string' ? s.role : s?.role?.slug || '')
    const list = staff || []
    const active = list.filter((s) => getStaffStatus(s) === 'active').length
    const pending = list.filter((s) => getStaffStatus(s) === 'pending').length
    const disabled = list.filter((s) => getStaffStatus(s) === 'disabled').length
    const now = dayjs()
    const startOfMonth = now.startOf('month').toDate()
    const recentlyAdded = list.filter((s) => s.createdAt && new Date(s.createdAt) >= startOfMonth).length
    const recentlyRegisteredBO = businessOwners.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= startOfMonth
    ).length
    const totalInspectors = list.filter((s) => getRoleSlug(s) === 'inspector').length
    const totalOfficers = list.filter((s) => getRoleSlug(s) === 'lgu_officer').length
    const totalManagers = list.filter((s) => getRoleSlug(s) === 'lgu_manager').length
    const totalAdmins = (users || []).filter((u) => u?.role === 'admin').length
    return {
      totalActive: active,
      totalPending: pending,
      totalDisabled: disabled,
      totalStaff: list.length,
      recentlyAdded,
      totalBusinessOwners: businessOwners.length,
      recentlyRegisteredBO,
      totalInspectors,
      totalOfficers,
      totalManagers,
      totalAdmins,
    }
  }, [staff, businessOwners, users])

  const chartData = useMemo(
    () => [
      { type: 'Active', count: stats.totalActive },
      { type: 'Pending', count: stats.totalPending },
      { type: 'Disabled', count: stats.totalDisabled },
    ],
    [stats.totalActive, stats.totalPending, stats.totalDisabled]
  )

  const chartConfig = useMemo(
    () => ({
      data: chartData,
      angleField: 'count',
      colorField: 'type',
      color: [token.colorSuccess, token.colorWarning, token.colorError],
      radius: 1,
      innerRadius: 0.6,
      legend: { position: 'bottom' },
      label: false,
      statistic: { title: false, content: { content: 'Staff' } },
    }),
    [chartData, token.colorSuccess, token.colorWarning, token.colorError]
  )

  const cardGroups = [
    {
      title: 'Staff Overview',
      cards: [
        { key: 'pending', label: 'Pending Staff', value: stats.totalPending, icon: ClockCircleOutlined },
        { key: 'disabled', label: 'Disabled Staff', value: stats.totalDisabled, icon: StopOutlined },
        { key: 'total', label: 'Total Staff', value: stats.totalStaff, icon: UserAddOutlined },
        { key: 'recent', label: 'Recently Added (This month)', value: stats.recentlyAdded, icon: HistoryOutlined },
      ],
    },
    {
      title: 'Staff by Role',
      cards: [
        { key: 'inspectors', label: 'Total Inspectors', value: stats.totalInspectors, icon: AuditOutlined },
        { key: 'officers', label: 'Total Officers', value: stats.totalOfficers, icon: IdcardOutlined },
        { key: 'managers', label: 'Total Managers', value: stats.totalManagers, icon: CrownOutlined },
      ],
    },
    {
      title: 'Business Owners',
      cards: [
        { key: 'businessOwners', label: 'Business Owners', value: stats.totalBusinessOwners, icon: ShopOutlined },
        { key: 'recentBO', label: 'New This Month', value: stats.recentlyRegisteredBO, icon: HistoryOutlined },
      ],
    },
    {
      title: 'Administration',
      cards: [
        { key: 'admins', label: 'Total Admins', value: stats.totalAdmins, icon: SafetyOutlined },
      ],
    },
  ]

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%'}}>
        {cardGroups.map((group) => (
          <div key={group.title}>
            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15, color: token.colorText }}>
              {group.title}
            </Text>
            <Row gutter={[16, 16]} align="stretch">
              {group.cards.map(({ key, label, value, icon: Icon }) => (
                <Col xs={24} sm={12} md={8} lg={6} key={key}>
                  <Card size="small" style={{ height: '100%' }}>
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
                            background: CARD_COLORS[key] || token.colorPrimary,
                            color: '#fff',
                          }}
                        >
                          <Icon style={{ fontSize: 18 }} />
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
                      </div>
                    </div>
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
            <Link to="/admin/users?tab=logs">View all</Link>
          </div>
          <Card size="small">
            <Table
              size="small"
              dataSource={recentLogs}
              rowKey={(r) => r.id || r._id || Math.random()}
              loading={recentLoading}
              pagination={false}
              onRow={(record) => ({
                onClick: () => {
                  const id = record.id || record._id
                  if (id) navigate(`/admin/users?tab=logs&logId=${encodeURIComponent(id)}`)
                },
                style: { cursor: 'pointer' },
              })}
              columns={[
                {
                  title: 'Action',
                  dataIndex: 'eventType',
                  key: 'action',
                  width: 180,
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
              ]}
              locale={{ emptyText: <Empty description="No recent activity" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
