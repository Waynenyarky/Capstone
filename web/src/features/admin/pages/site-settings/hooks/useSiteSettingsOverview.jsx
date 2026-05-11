import { useMemo } from 'react'
import { Tag } from 'antd'
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
import dayjs from 'dayjs'
import { CARD_COLORS } from '../../maintenance/constants/maintenance.constants'

const ACTION_LABELS = {
  admin_approval_request: 'Request submitted',
  admin_approval_approved: 'Approved',
  admin_approval_rejected: 'Rejected',
  maintenance_mode: 'Maintenance mode',
}

const actionLabel = (eventType) => ACTION_LABELS[eventType] || eventType || '—'

export function useSiteSettingsOverview({
  current,
  approvals = [],
  services = [],
  dependencies = null,
  servicesLoading = false,
  recentLogs = [],
}) {
  const isActive = current?.isActive === true

  const approvalStats = useMemo(() => {
    return {
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
    }
  }, [approvals])

  const recentActivitySource = useMemo(() => {
    if (recentLogs.length > 0) return recentLogs
    return [...approvals].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    ).slice(0, 10)
  }, [recentLogs, approvals])

  const cardGroups = useMemo(() => {
    return [
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
  }, [servicesLoading, services, dependencies, isActive, current, approvalStats])

  const recentColumns = useMemo(() => {
    const isAuditLog = (record) => record && record.eventType != null

    if (recentActivitySource.length > 0 && isAuditLog(recentActivitySource[0])) {
      return [
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
    }
    return [
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
  }, [recentActivitySource])

  const onRowClick = (record, setTabKey) => {
    if (record && record.eventType != null && (record.id || record._id)) {
      const id = record.id || record._id
      window.location.href = `/admin/users?tab=logs&logId=${encodeURIComponent(id)}`
      return
    }
    if (record?.approvalId) setTabKey('requests')
  }

  const isAuditLog = (record) => record && record.eventType != null

  return {
    cardGroups,
    recentColumns,
    recentActivitySource,
    onRowClick,
    isAuditLog,
    CARD_COLORS,
  }
}
