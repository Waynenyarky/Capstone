import React, { useState } from 'react'
import {
  Descriptions,
  Empty,
  Button,
  Space,
  Tag,
  Typography,
  theme,
  Modal,
  Input,
  Checkbox,
  message,
} from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import {
  acknowledgeIncident,
  resolveIncident,
  updateContainment,
} from '@/features/admin/services/tamperService'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

const { TextArea } = Input
const { Text } = Typography

const statusColors = { new: 'red', acknowledged: 'gold', resolved: 'green' }
const severityColors = { high: 'red', medium: 'orange', low: 'blue' }

export default function IncidentDetailPanel({
  incident,
  onRefresh,
}) {
  const { token } = theme.useToken()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()
  const [resolveModal, setResolveModal] = useState({ open: false, notes: '', liftContainment: false })
  const [resolving, setResolving] = useState(false)

  const openResolveModal = () => {
    setResolveModal({
      open: true,
      notes: '',
      liftContainment: incident?.containmentActive ?? false,
    })
  }

  const closeResolveModal = () => {
    setResolveModal({ open: false, notes: '', liftContainment: false })
  }

  const handleAck = async () => {
    if (!incident?.id) return
    try {
      await runWithStepUp(async (stepUpToken) => {
        await acknowledgeIncident(incident.id, undefined, { stepUpToken })
      })
      message.success('Incident acknowledged')
      onRefresh?.()
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to acknowledge')
    }
  }

  const handleContainment = async (next) => {
    if (!incident?.id) return
    try {
      await runWithStepUp(async (stepUpToken) => {
        await updateContainment(incident.id, next, { stepUpToken })
      })
      message.success(next ? 'Containment enabled' : 'Containment lifted')
      onRefresh?.()
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to update containment')
    }
  }

  const handleResolveSubmit = async () => {
    if (!incident?.id) return
    setResolving(true)
    try {
      await runWithStepUp(async (stepUpToken) => {
        await resolveIncident(incident.id, resolveModal.notes || '', resolveModal.liftContainment, { stepUpToken })
      })
      message.success('Incident resolved')
      closeResolveModal()
      onRefresh?.()
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  if (!incident) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<SafetyCertificateOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />}
          styles={{ image: { height: 60 } }}
          description={<Text type="secondary">Select an incident to view details</Text>}
        />
      </div>
    )
  }

  const isResolved = incident.status === 'resolved'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with actions */}
      <div
        style={{
          padding: '16px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text strong style={{ fontSize: 15, display: 'block' }} ellipsis>
            {incident.message || 'Tamper incident'}
          </Text>
          <Space size={8} style={{ marginTop: 4 }}>
            <Tag color={statusColors[incident.status] || 'default'}>{incident.status}</Tag>
            <Tag color={severityColors[incident.severity] || 'default'}>{incident.severity}</Tag>
            {incident.containmentActive && <Tag color="red">Containment active</Tag>}
          </Space>
        </div>
        {!isResolved && (
          <Space size="small" wrap>
            <Button size="small" onClick={handleAck}>
              Acknowledge
            </Button>
            <Button
              size="small"
              danger={incident.containmentActive}
              onClick={() => handleContainment(!incident.containmentActive)}
            >
              {incident.containmentActive ? 'Lift containment' : 'Contain'}
            </Button>
            <Button size="small" type="primary" onClick={openResolveModal}>
              Resolve
            </Button>
          </Space>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 20px' }}>
        <Descriptions
          column={1}
          size="small"
          styles={{
            label: { color: token.colorTextSecondary, fontSize: 12, paddingBottom: 2 },
            content: { fontSize: 13, paddingBottom: 12 },
          }}
        >
          <Descriptions.Item label="Message">
            {incident.message || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[incident.status] || 'default'}>{incident.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Severity">
            <Tag color={severityColors[incident.severity] || 'default'}>{incident.severity}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Verification status">
            {incident.verificationStatus || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Containment">
            <Tag color={incident.containmentActive ? 'red' : 'blue'}>
              {incident.containmentActive ? 'Active' : 'Off'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Detected">
            {incident.detectedAt ? new Date(incident.detectedAt).toLocaleString() : '—'}
          </Descriptions.Item>
          {incident.acknowledgedAt && (
            <Descriptions.Item label="Acknowledged">
              {new Date(incident.acknowledgedAt).toLocaleString()}
            </Descriptions.Item>
          )}
          {incident.resolvedAt && (
            <Descriptions.Item label="Resolved">
              {new Date(incident.resolvedAt).toLocaleString()}
            </Descriptions.Item>
          )}
          {incident.resolutionNotes && (
            <Descriptions.Item label="Resolution notes">
              {incident.resolutionNotes}
            </Descriptions.Item>
          )}
          {incident.affectedUserIds?.length > 0 && (
            <Descriptions.Item label="Affected user IDs">
              <Text style={{ fontSize: 12 }}>{incident.affectedUserIds.join(', ')}</Text>
            </Descriptions.Item>
          )}
          {incident.auditLogIds?.length > 0 && (
            <Descriptions.Item label="Audit log IDs">
              <Text style={{ fontSize: 12 }}>{incident.auditLogIds.join(', ')}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <Modal
        title="Resolve incident"
        open={resolveModal.open}
        onCancel={closeResolveModal}
        onOk={handleResolveSubmit}
        confirmLoading={resolving}
        okText="Resolve"
        destroyOnHidden
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
      {stepUpModal}
    </div>
  )
}
