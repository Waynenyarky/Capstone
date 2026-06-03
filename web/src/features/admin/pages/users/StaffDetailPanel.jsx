import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Typography, Tag, Button, Descriptions, Space, theme, Empty, Table, Input, Select, Tooltip, Modal, DatePicker } from 'antd'
import {
  EditOutlined,
  KeyOutlined,
  StopOutlined,
  PlayCircleOutlined,
  UserOutlined,
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { roleLabel, officeLabel, getStaffStatusTag } from './useAdminUsersPage'
import { getAuditHistoryAdmin } from '../../services'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const ACTION_LABELS = {
  profile_update: 'Profile updated',
  password_change: 'Password changed',
  mfa_enabled: 'MFA enabled',
  mfa_disabled: 'MFA disabled',
  email_change: 'Email changed',
  email_change_reverted: 'Email change reverted',
  session_invalidated: 'Session invalidated',
  session_timeout: 'Session timed out',
  temporary_credentials_issued: 'Temporary credentials issued',
  temporary_credentials_used: 'Temporary credentials used',
  temporary_credentials_expired: 'Temporary credentials expired',
  account_lockout: 'Account locked',
  account_unlock: 'Account unlocked',
  name_update: 'Name updated',
  contact_update: 'Contact updated',
  admin_approval: 'Admin approval',
  admin_approval_approved: 'Approval granted',
  admin_approval_rejected: 'Approval rejected',
  security_event: 'Security event',
  account_recovery_initiated: 'Recovery initiated',
  account_recovery_completed: 'Recovery completed',
  account_deletion_requested: 'Deletion requested',
}

const actionLabel = (eventType) => ACTION_LABELS[eventType] || eventType || '—'

const ACTION_TYPE_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))

const STATIC_AUDIT_LOGS = [
  { id: '1', eventType: 'profile_update', createdAt: new Date().toISOString(), fieldChanged: 'firstName', oldValue: 'John', newValue: 'Jonathan', role: 'lgu_officer', metadata: { reason: 'Name correction requested', ip: '10.0.1.42' } },
  { id: '2', eventType: 'password_change', createdAt: new Date(Date.now() - 86400000).toISOString(), role: 'admin', metadata: { reason: 'Initial password setup', ip: '192.168.1.1' } },
  { id: '3', eventType: 'mfa_enabled', createdAt: new Date(Date.now() - 172800000).toISOString(), fieldChanged: 'mfa', role: 'lgu_officer', metadata: { ip: '10.0.1.42' } },
  { id: '4', eventType: 'email_change', createdAt: new Date(Date.now() - 345600000).toISOString(), fieldChanged: 'email', oldValue: 'old@example.com', newValue: 'new@example.com', role: 'lgu_officer', metadata: { reason: 'Corrected typo in email', ip: '10.0.1.42' } },
  { id: '5', eventType: 'session_invalidated', createdAt: new Date(Date.now() - 432000000).toISOString(), role: 'admin', metadata: { reason: 'Security review', ip: '192.168.1.1' } },
  { id: '6', eventType: 'temporary_credentials_issued', createdAt: new Date(Date.now() - 518400000).toISOString(), role: 'admin', metadata: { reason: 'Staff onboarding', ip: '192.168.1.1' } },
]

export default function StaffDetailPanel({
  staff,
  officeGroupsState,
  roleOptionsState,
  onEdit,
  onResetPassword,
  onDisableAccount,
  onActivateAccount,
  activateLoading,
}) {
  const { token } = theme.useToken()
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState(null)
  const [auditDateRange, setAuditDateRange] = useState(null)
  const [auditFilterOpen, setAuditFilterOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const auditFilterRef = useRef(null)

  const loadAuditLogs = useCallback(async () => {
    if (!staff?.id) return
    try {
      setAuditLoading(true)
      const params = { userId: staff.id, limit: 50 }
      if (auditDateRange?.[0] && auditDateRange?.[1]) {
        params.startDate = auditDateRange[0].startOf('day').toISOString()
        params.endDate = auditDateRange[1].endOf('day').toISOString()
      }
      if (auditActionFilter) {
        params.eventType = auditActionFilter
      }
      const res = await getAuditHistoryAdmin(params)
      const logs = res?.logs || res?.auditLogs || []
      setAuditLogs(logs.length > 0 ? logs : STATIC_AUDIT_LOGS)
    } catch {
      setAuditLogs(STATIC_AUDIT_LOGS)
    } finally {
      setAuditLoading(false)
    }
  }, [staff?.id, auditDateRange, auditActionFilter])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  useEffect(() => {
    if (!auditFilterOpen) return
    const handleClickOutside = (e) => {
      if (auditFilterRef.current && !auditFilterRef.current.contains(e.target)) {
        const isDropdown = e.target.closest('.ant-select-dropdown') || e.target.closest('.ant-picker-dropdown')
        if (!isDropdown) setAuditFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [auditFilterOpen])

  const filteredAuditLogs = useMemo(() => {
    let list = auditLogs
    if (auditSearch.trim()) {
      const q = auditSearch.trim().toLowerCase()
      list = list.filter((r) =>
        actionLabel(r.eventType).toLowerCase().includes(q) ||
        (r.fieldChanged || '').toLowerCase().includes(q)
      )
    }
    if (auditActionFilter) {
      list = list.filter((r) => r.eventType === auditActionFilter)
    }
    return list
  }, [auditLogs, auditSearch, auditActionFilter])

  const auditActiveFilterCount = [auditActionFilter, auditDateRange].filter(Boolean).length

  if (!staff) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<UserOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select a staff member to view details</Text>}
        />
      </div>
    )
  }

  const fullName = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Unnamed'
  const isActive = staff.isActive !== false
  const needsOnboarding = staff.mustChangeCredentials || staff.mustSetupMfa
  const statusTag = getStaffStatusTag(staff)

  const auditColumns = [
    { title: 'Action', dataIndex: 'eventType', key: 'action', render: (v) => actionLabel(v) },
    { title: 'Field', dataIndex: 'fieldChanged', key: 'field', render: (v) => v || '—' },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v) => (v ? dayjs(v).format('MMM D, YYYY HH:mm') : '—') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#fff',
              color: token.colorText,
              border: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {(staff.firstName?.[0] || staff.email?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title level={5} style={{ margin: 0, lineHeight: 1.3 }} ellipsis={{ rows: 1 }}>
              {fullName}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {staff.email}
            </Text>
          </div>
        </div>
        <Space size="small" style={{ flexShrink: 0 }}>
          <Button icon={<EditOutlined />} onClick={() => onEdit(staff)}>
            Edit Details
          </Button>
          <Button icon={<KeyOutlined />} onClick={() => onResetPassword(staff)}>
            Reset Password
          </Button>
          {isActive && onDisableAccount && (
            <Button icon={<StopOutlined />} danger onClick={() => onDisableAccount(staff)}>
              Disable Account
            </Button>
          )}
          {!isActive && onActivateAccount && (
            <Button icon={<PlayCircleOutlined />} type="primary" loading={activateLoading} onClick={() => onActivateAccount(staff)}>
              Activate Account
            </Button>
          )}
        </Space>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Details - hugs content */}
        <div style={{ flexShrink: 0, padding: '16px 20px' }}>
          <Descriptions
            column={2}
            size="small"
            styles={{
              label: { color: token.colorTextSecondary, fontSize: 12, verticalAlign: 'top', lineHeight: 1.5 },
              content: { fontSize: 12, verticalAlign: 'top', lineHeight: 1.5 },
            }}
          >
          {staff.phoneNumber && (
            <Descriptions.Item label="Contact Number">
              {staff.phoneNumber}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Status">
            <Space size={2}>
              <Tag color={statusTag.color}>{statusTag.label}</Tag> {needsOnboarding ? <Tag color="orange">Onboarding Required</Tag> : <Tag color="blue">Onboarding Complete</Tag>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Office">
            <Space size={6}>
              {officeLabel(staff.office, officeGroupsState) || '—'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            {roleLabel(staff.role, roleOptionsState)}
          </Descriptions.Item>
          {staff.createdAt && (
            <Descriptions.Item label="Created">
              {new Date(staff.createdAt).toLocaleString()} by {staff.createdBy?.label ?? 'Unknown'}
            </Descriptions.Item>
          )}
        </Descriptions>
        </div>

        {/* Audit section - fills remaining space */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 24, marginTop: 24, padding: '16px 20px' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>Activities</Title>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="Search action or field"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={auditFilterRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={auditActiveFilterCount > 0 ? 'primary' : 'default'}
                ghost={auditActiveFilterCount > 0}
                onClick={() => setAuditFilterOpen((prev) => !prev)}
                aria-label="Toggle audit filters"
              />
            </Tooltip>
            {auditFilterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: '16px 20px',
                  background: '#fff',
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  zIndex: 50,
                  minWidth: 240,
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
                    onClick={() => setAuditFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Date range</Text>
                  <RangePicker
                    value={auditDateRange}
                    onChange={setAuditDateRange}
                    style={{ width: '100%' }}
                    size="small"
                    allowClear
                    format="MMM D, YYYY"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Action type</Text>
                  <Select
                    placeholder="All actions"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={auditActionFilter}
                    onChange={setAuditActionFilter}
                    style={{ width: '100%' }}
                    options={ACTION_TYPE_OPTIONS}
                    size="small"
                  />
                </div>
                {auditActiveFilterCount > 0 && (
                  <Button size="small" type="link" onClick={() => { setAuditActionFilter(null); setAuditDateRange(null) }} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table
          size="small"
          rowKey={(r) => r.id || r._id || Math.random()}
          dataSource={filteredAuditLogs}
          columns={auditColumns}
          loading={auditLoading}
          pagination={false}
          locale={{ emptyText: 'No audit activity' }}
          onRow={(record) => ({
            onClick: () => setSelectedLog(record),
            style: { cursor: 'pointer' },
          })}
        />
        </div>
        </div>
      </div>

      {/* Audit detail modal */}
      <Modal
        title={selectedLog ? actionLabel(selectedLog.eventType) : 'Audit Detail'}
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        destroyOnHidden
      >
        {selectedLog && (
          <Descriptions
            column={1}
            size="small"
            styles={{
              label: { color: token.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
              content: { fontSize: 13, paddingBottom: 12 },
            }}
          >
            <Descriptions.Item label="Action">{actionLabel(selectedLog.eventType)}</Descriptions.Item>
            {selectedLog.fieldChanged && (
              <Descriptions.Item label="Field changed">{selectedLog.fieldChanged}</Descriptions.Item>
            )}
            {selectedLog.oldValue != null && selectedLog.oldValue !== '' && (
              <Descriptions.Item label="Previous value">
                <Text type="secondary" style={{ fontFamily: 'monospace' }}>{selectedLog.oldValue}</Text>
              </Descriptions.Item>
            )}
            {selectedLog.newValue != null && selectedLog.newValue !== '' && (
              <Descriptions.Item label="New value">
                <Text style={{ fontFamily: 'monospace' }}>{selectedLog.newValue}</Text>
              </Descriptions.Item>
            )}
            {selectedLog.role && (
              <Descriptions.Item label="Performed by"><Tag>{selectedLog.role}</Tag></Descriptions.Item>
            )}
            {selectedLog.metadata?.reason && (
              <Descriptions.Item label="Reason">{selectedLog.metadata.reason}</Descriptions.Item>
            )}
            {selectedLog.metadata?.ip && (
              <Descriptions.Item label="IP address">{selectedLog.metadata.ip}</Descriptions.Item>
            )}
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.createdAt).format('MMMM D, YYYY HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
