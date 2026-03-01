import React, { useEffect, useMemo, useState } from 'react'
import { Card, Table, Tag, Button, Space, Typography, message, Tooltip, Empty } from 'antd'
import {
  fetchTamperIncidents,
  fetchTamperStats,
  acknowledgeIncident,
  resolveIncident,
  updateContainment,
} from '@/features/admin/services'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

const statusColors = {
  new: 'red',
  acknowledged: 'gold',
  resolved: 'green',
}

const severityColors = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
}

const verificationStatusLabels = {
  tamper_detected: 'Tamper detected',
  verification_error: 'Verification error',
  not_logged: 'Not logged',
  security_event: 'Security event',
}

export default function TamperIncidentsPanel() {
  const [loading, setLoading] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState(null)
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const load = async () => {
    setLoading(true)
    try {
      const [incRes, statsRes] = await Promise.all([fetchTamperIncidents({ limit: 100 }), fetchTamperStats()])
      if (incRes?.incidents) setIncidents(incRes.incidents)
      if (statsRes?.stats) setStats(statsRes.stats)
    } catch {
      message.error('Failed to load tamper incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAck = async (id) => {
    try {
      await runWithStepUp(async (stepUpToken) => {
        await acknowledgeIncident(id, undefined, { stepUpToken })
        message.success('Incident acknowledged')
        load()
      })
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to acknowledge')
    }
  }

  const handleContainment = async (id, next) => {
    try {
      await runWithStepUp(async (stepUpToken) => {
        await updateContainment(id, next, { stepUpToken })
        message.success(next ? 'Containment enabled' : 'Containment lifted')
        load()
      })
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to update containment')
    }
  }

  const handleResolve = async (id) => {
    const notes = window.prompt('Add a short resolution note (optional):', '')
    if (notes === null) return
    try {
      await runWithStepUp(async (stepUpToken) => {
        await resolveIncident(id, notes || '', false, { stepUpToken })
        message.success('Incident resolved')
        load()
      })
    } catch (e) {
      if (e?.message !== 'Step-up cancelled') message.error('Failed to resolve')
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v) => <Tag color={statusColors[v] || 'default'}>{v}</Tag>,
      },
      {
        title: 'Severity',
        dataIndex: 'severity',
        key: 'severity',
        render: (v) => <Tag color={severityColors[v] || 'default'}>{v}</Tag>,
      },
      {
        title: 'Verification',
        dataIndex: 'verificationStatus',
        key: 'verificationStatus',
        render: (v) => <Tag>{verificationStatusLabels[v] || v || 'unknown'}</Tag>,
      },
      {
        title: 'Containment',
        dataIndex: 'containmentActive',
        key: 'containmentActive',
        render: (v) => <Tag color={v ? 'red' : 'blue'}>{v ? 'active' : 'off'}</Tag>,
      },
      {
        title: 'Detected',
        dataIndex: 'detectedAt',
        key: 'detectedAt',
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Mark as acknowledged">
              <Button size="small" onClick={() => handleAck(record.id)} disabled={record.status === 'resolved'}>
                Ack
              </Button>
            </Tooltip>
            <Tooltip title="Toggle containment for affected accounts">
              <Button
                size="small"
                onClick={() => handleContainment(record.id, !record.containmentActive)}
                danger={record.containmentActive}
              >
                {record.containmentActive ? 'Lift' : 'Contain'}
              </Button>
            </Tooltip>
            <Tooltip title="Resolve and close">
              <Button size="small" type="primary" onClick={() => handleResolve(record.id)}>
                Resolve
              </Button>
            </Tooltip>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <>
    <Card
      title="Tamper Incidents"
      size="small"
      extra={
        <Space>
          {stats && (
            <Typography.Text type="secondary">
              Open {stats.open ?? 0} · Ack {stats.acknowledged ?? 0} · Resolved {stats.resolved ?? 0}
            </Typography.Text>
          )}
          <Button size="small" onClick={load} loading={loading}>
            Refresh
          </Button>
        </Space>
      }
    >
      <Table
        rowKey={(rec) => rec.id}
        dataSource={incidents}
        columns={columns}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="No tamper incidents" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
    </Card>
    {stepUpModal}
    </>
  )
}
