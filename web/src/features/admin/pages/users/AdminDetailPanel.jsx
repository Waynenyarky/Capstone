import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Typography, Tag, Button, Descriptions, Space, theme, Empty, Table, Input, Select, Tooltip, Modal, DatePicker, Alert } from 'antd'
import {
  EditOutlined,
  KeyOutlined,
  StopOutlined,
  UserOutlined,
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getAuditHistoryAdmin } from '../../services'
import { getAdminPendingApprovals } from '../../services/staffService'

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

const REQUEST_TYPE_LABELS = {
  personal_info_change: 'Edit Details',
  account_status_change: 'Account Status Change',
  password_reset: 'Password Reset',
}

export default function AdminDetailPanel({
  admin,
  currentUserId,
  onRequestEdit,
  onRequestResetPassword,
  onRequestDisable,
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
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)

  const isSelf = admin && currentUserId && String(admin.id) === String(currentUserId)

  const loadAuditLogs = useCallback(async () => {
    if (!admin?.id) return
    try {
      setAuditLoading(true)
      const params = { userId: admin.id, limit: 50 }
      if (auditDateRange?.[0] && auditDateRange?.[1]) {
        params.startDate = auditDateRange[0].startOf('day').toISOString()
        params.endDate = auditDateRange[1].endOf('day').toISOString()
      }
      if (auditActionFilter) {
        params.eventType = auditActionFilter
      }
      const res = await getAuditHistoryAdmin(params)
      const logs = res?.logs || res?.auditLogs || []
      setAuditLogs(logs)
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }, [admin?.id, auditDateRange, auditActionFilter])

  const loadPendingApprovals = useCallback(async () => {
    if (!admin?.id) return
    try {
      setPendingLoading(true)
      const approvals = await getAdminPendingApprovals(admin.id)
      setPendingApprovals(approvals)
    } catch {
      setPendingApprovals([])
    } finally {
      setPendingLoading(false)
    }
  }, [admin?.id])

  useEffect(() => {
    loadAuditLogs()
    loadPendingApprovals()
  }, [loadAuditLogs, loadPendingApprovals])

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

  if (!admin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<UserOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select an admin to view details</Text>}
        />
      </div>
    )
  }

  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || 'Unnamed'
  const isActive = admin.isActive !== false

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
            {(admin.firstName?.[0] || admin.email?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title level={5} style={{ margin: 0, lineHeight: 1.3 }} ellipsis={{ rows: 1 }}>
              {fullName}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {admin.email}
            </Text>
          </div>
        </div>
        {!isSelf && (
          <Space size="small" style={{ flexShrink: 0 }}>
            <Button icon={<EditOutlined />} onClick={() => onRequestEdit(admin)}>
              Request Edit
            </Button>
            <Button icon={<KeyOutlined />} onClick={() => onRequestResetPassword(admin)}>
              Request Reset
            </Button>
            {isActive && onRequestDisable && (
              <Button icon={<StopOutlined />} danger onClick={() => onRequestDisable(admin)}>
                Request Disable
              </Button>
            )}
          </Space>
        )}
        {isSelf && (
          <Tag color="blue">This is you</Tag>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Details */}
        <div style={{ flexShrink: 0, padding: '16px 20px' }}>
          <Descriptions
            column={2}
            size="small"
            styles={{
              label: { color: token.colorTextSecondary, fontSize: 12, verticalAlign: 'top', lineHeight: 1.5 },
              content: { fontSize: 12, verticalAlign: 'top', lineHeight: 1.5 },
            }}
          >
            {admin.phoneNumber && (
              <Descriptions.Item label="Contact Number">
                {admin.phoneNumber}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Disabled'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color="gold">Administrator</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MFA">
              <Tag color={admin.mfaEnabled ? 'green' : 'orange'}>{admin.mfaEnabled ? 'Enabled' : 'Not Set Up'}</Tag>
            </Descriptions.Item>
            {admin.createdAt && (
              <Descriptions.Item label="Created">
                {new Date(admin.createdAt).toLocaleString()}
                {admin.createdBy && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {' '}by {admin.createdBy.label}
                  </Text>
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div style={{ flexShrink: 0, padding: '0 20px 16px' }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
              <ClockCircleOutlined style={{ marginRight: 8, color: token.colorWarning }} />
              Pending Approval Requests
            </Title>
            {pendingApprovals.map((approval) => (
              <Alert
                key={approval.approvalId}
                type="warning"
                showIcon
                icon={<ClockCircleOutlined />}
                style={{ marginBottom: 8 }}
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <Text strong>{REQUEST_TYPE_LABELS[approval.requestType] || approval.requestType}</Text>
                      {' — '}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {approval.currentApprovals}/{approval.requiredApprovals} approvals
                      </Text>
                    </span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(approval.createdAt).format('MMM D, YYYY HH:mm')}
                    </Text>
                  </div>
                }
                description={
                  approval.requestedBy && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Requested by {[approval.requestedBy.firstName, approval.requestedBy.lastName].filter(Boolean).join(' ') || approval.requestedBy.email}
                    </Text>
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Audit section */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderTop: `1px solid ${token.colorBorderSecondary}`, padding: '16px 20px' }}>
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
