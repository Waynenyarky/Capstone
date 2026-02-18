import React, { useCallback, useEffect, useState } from 'react'
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  message,
  Tooltip,
  Modal,
  Input,
  Checkbox,
  Typography,
} from 'antd'
import {
  fetchTamperIncidents,
  acknowledgeIncident,
  resolveIncident,
  updateContainment,
} from '@/features/admin/services/tamperService'

const { TextArea } = Input
const { Text } = Typography

const statusColors = { new: 'red', acknowledged: 'gold', resolved: 'green' }
const severityColors = { high: 'red', medium: 'orange', low: 'blue' }
const LIMIT = 50

export default function AuditTamperIncidentsTab({ onRefresh }) {
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [severityFilter, setSeverityFilter] = useState(undefined)
  const [resolveModal, setResolveModal] = useState({ open: false, id: null, notes: '', liftContainment: false })
  const [resolving, setResolving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: LIMIT }
      if (statusFilter) params.status = statusFilter
      if (severityFilter) params.severity = severityFilter
      const res = await fetchTamperIncidents(params)
      if (res?.incidents) setIncidents(res.incidents)
    } catch {
      message.error('Failed to load tamper incidents')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleAck = async (id) => {
    try {
      await acknowledgeIncident(id)
      message.success('Incident acknowledged')
      load()
      onRefresh?.()
    } catch {
      message.error('Failed to acknowledge')
    }
  }

  const handleContainment = async (id, next) => {
    try {
      await updateContainment(id, next)
      message.success(next ? 'Containment enabled' : 'Containment lifted')
      load()
      onRefresh?.()
    } catch {
      message.error('Failed to update containment')
    }
  }

  const openResolveModal = (id) => {
    const record = incidents.find((r) => r.id === id)
    setResolveModal({
      open: true,
      id,
      notes: '',
      liftContainment: record?.containmentActive ?? false,
    })
  }

  const closeResolveModal = () => {
    setResolveModal({ open: false, id: null, notes: '', liftContainment: false })
  }

  const handleResolveSubmit = async () => {
    if (!resolveModal.id) return
    setResolving(true)
    try {
      await resolveIncident(resolveModal.id, resolveModal.notes || '', resolveModal.liftContainment)
      message.success('Incident resolved')
      closeResolveModal()
      load()
      onRefresh?.()
    } catch {
      message.error('Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  const columns = [
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true, width: 180 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v) => <Tag color={statusColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (v) => <Tag color={severityColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Verification',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 120,
      render: (v) => <Tag>{v || 'unknown'}</Tag>,
    },
    {
      title: 'Containment',
      dataIndex: 'containmentActive',
      key: 'containmentActive',
      width: 100,
      render: (v) => <Tag color={v ? 'red' : 'blue'}>{v ? 'active' : 'off'}</Tag>,
    },
    {
      title: 'Detected',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 150,
      render: (v) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="Mark as acknowledged">
            <Button
              size="small"
              onClick={() => handleAck(record.id)}
              disabled={record.status === 'resolved'}
            >
              Ack
            </Button>
          </Tooltip>
          <Tooltip title="Toggle containment for affected accounts">
            <Button
              size="small"
              onClick={() => handleContainment(record.id, !record.containmentActive)}
              danger={record.containmentActive}
              disabled={record.status === 'resolved'}
            >
              {record.containmentActive ? 'Lift' : 'Contain'}
            </Button>
          </Tooltip>
          <Tooltip title="Resolve and close">
            <Button
              size="small"
              type="primary"
              onClick={() => openResolveModal(record.id)}
              disabled={record.status === 'resolved'}
            >
              Resolve
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'new', label: 'New' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
        <Select
          placeholder="Severity"
          allowClear
          style={{ width: 120 }}
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
      </div>

      <Table
        rowKey={(rec) => rec.id}
        dataSource={incidents}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="small"
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '8px 0' }}>
              {record.affectedUserIds?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Affected user IDs: </Text>
                  <Text style={{ fontSize: 12 }}>{record.affectedUserIds.join(', ')}</Text>
                </div>
              )}
              {record.auditLogIds?.length > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Audit log IDs: </Text>
                  <Text style={{ fontSize: 12 }}>{record.auditLogIds.join(', ')}</Text>
                </div>
              )}
              {(!record.affectedUserIds?.length && !record.auditLogIds?.length) && (
                <Text type="secondary" style={{ fontSize: 12 }}>No additional details.</Text>
              )}
            </div>
          ),
        }}
        locale={{ emptyText: 'No tamper incidents' }}
      />

      <Modal
        title="Resolve incident"
        open={resolveModal.open}
        onCancel={closeResolveModal}
        onOk={handleResolveSubmit}
        confirmLoading={resolving}
        okText="Resolve"
        destroyOnClose
        okButtonProps={{ disabled: !resolveModal.notes?.trim() }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>Resolution notes (required)</Text>
          <TextArea
            rows={3}
            placeholder="Describe what was done to resolve this incident..."
            value={resolveModal.notes}
            onChange={(e) => setResolveModal((p) => ({ ...p, notes: e.target.value }))}
            style={{ marginTop: 8 }}
          />
        </div>
        <Checkbox
          checked={resolveModal.liftContainment}
          onChange={(e) => setResolveModal((p) => ({ ...p, liftContainment: e.target.checked }))}
        >
          Lift containment for affected accounts after resolving
        </Checkbox>
      </Modal>
    </div>
  )
}
