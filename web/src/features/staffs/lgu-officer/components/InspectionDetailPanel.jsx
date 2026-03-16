import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Card, Tag, Descriptions, Button, Select, DatePicker,
  Space, Alert, Divider, List, Badge, Spin, Empty, message, theme,
} from 'antd'
import {
  UserOutlined, CalendarOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  WarningOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { get, put, post } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const STATUS_CONFIG = {
  pending_assignment: { color: 'warning', label: 'Needs Assignment', icon: <ClockCircleOutlined /> },
  pending: { color: 'processing', label: 'Scheduled', icon: <CalendarOutlined /> },
  in_progress: { color: 'processing', label: 'In Progress', icon: <SafetyCertificateOutlined /> },
  completed: { color: 'success', label: 'Completed', icon: <CheckCircleOutlined /> },
}

const RESULT_CONFIG = {
  passed: { color: 'success', label: 'Passed' },
  failed: { color: 'error', label: 'Failed' },
  needs_reinspection: { color: 'warning', label: 'Needs Re-inspection' },
}

const SEVERITY_COLORS = {
  low: 'blue',
  medium: 'gold',
  high: 'orange',
  critical: 'red',
}

export default function InspectionDetailPanel({ inspection, onReviewComplete }) {
  const { token } = theme.useToken()
  const [inspectors, setInspectors] = useState([])
  const [loadingInspectors, setLoadingInspectors] = useState(false)
  const [selectedInspector, setSelectedInspector] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [violations, setViolations] = useState([])
  const [loadingViolations, setLoadingViolations] = useState(false)

  const status = inspection?.status || 'pending'
  const statusCfg = STATUS_CONFIG[status] || { color: 'default', label: status }

  // Fetch inspectors when in pending_assignment state
  useEffect(() => {
    if (status === 'pending_assignment') {
      fetchInspectors()
    }
  }, [status])

  // Fetch violations when inspection is completed
  useEffect(() => {
    if (status === 'completed' && inspection?._id) {
      fetchViolations()
    }
  }, [status, inspection?._id])

  const fetchInspectors = async () => {
    setLoadingInspectors(true)
    try {
      const res = await get('/api/lgu-officer/inspectors', { skipAutoLogout: true })
      setInspectors(res?.inspectors || [])
    } catch (err) {
      console.error('Failed to fetch inspectors:', err)
    }
    setLoadingInspectors(false)
  }

  const fetchViolations = async () => {
    setLoadingViolations(true)
    try {
      const res = await get(`/api/lgu-officer/inspections/${inspection._id}/violations`, { skipAutoLogout: true })
      setViolations(res?.violations || res?.data || [])
    } catch {
      // Violations endpoint may not exist yet; fallback to inline data
      setViolations(inspection?.violationsFound || [])
    }
    setLoadingViolations(false)
  }

  const handleAssign = async () => {
    if (!selectedInspector || !selectedDate) {
      message.warning('Please select an inspector and a date')
      return
    }
    setAssigning(true)
    try {
      await post('/api/lgu-officer/inspections', {
        inspectorId: selectedInspector,
        businessProfileId: inspection.businessProfileId,
        businessId: inspection.businessId,
        permitType: inspection.permitType || 'initial',
        inspectionType: inspection.inspectionType || 'initial',
        scheduledDate: selectedDate.toISOString(),
        parentInspectionId: inspection.parentInspectionId || undefined,
      })
      message.success('Inspector assigned successfully')
      onReviewComplete?.()
    } catch (err) {
      message.error(err?.message || 'Failed to assign inspector')
    }
    setAssigning(false)
  }

  const handleScheduleReinspection = async () => {
    if (!selectedInspector || !selectedDate) {
      message.warning('Please select an inspector and a date')
      return
    }
    setAssigning(true)
    try {
      await post('/api/lgu-officer/inspections', {
        inspectorId: selectedInspector,
        businessProfileId: inspection.businessProfileId,
        businessId: inspection.businessId,
        permitType: inspection.permitType || 'initial',
        inspectionType: 'follow_up',
        scheduledDate: selectedDate.toISOString(),
        parentInspectionId: inspection._id,
      })
      message.success('Re-inspection scheduled successfully')
      onReviewComplete?.()
    } catch (err) {
      message.error(err?.message || 'Failed to schedule re-inspection')
    }
    setAssigning(false)
  }

  if (!inspection) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="No inspection selected" />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <Title level={4} style={{ margin: 0 }}>
            {inspection.businessName || 'Inspection'}
          </Title>
          <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
        </div>
        {inspection.inspectionType && (
          <Text type="secondary">
            Type: {inspection.inspectionType} · Permit: {inspection.permitType || 'N/A'}
          </Text>
        )}
      </div>

      {/* Inspection Details */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Inspector">
            {inspection.inspectorName || (inspection.inspectorId ? `ID: ${String(inspection.inspectorId).slice(-6)}` : 'Not assigned')}
          </Descriptions.Item>
          <Descriptions.Item label="Scheduled">
            {inspection.scheduledDate ? dayjs(inspection.scheduledDate).format('MMM D, YYYY') : 'Not scheduled'}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned By">
            {inspection.assignedBy || 'System'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {inspection.createdAt ? dayjs(inspection.createdAt).format('MMM D, YYYY h:mm A') : 'N/A'}
          </Descriptions.Item>
          {inspection.completedAt && (
            <Descriptions.Item label="Completed">
              {dayjs(inspection.completedAt).format('MMM D, YYYY h:mm A')}
            </Descriptions.Item>
          )}
          {inspection.overallResult && (
            <Descriptions.Item label="Result">
              <Tag color={RESULT_CONFIG[inspection.overallResult]?.color}>
                {RESULT_CONFIG[inspection.overallResult]?.label || inspection.overallResult}
              </Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Assignment Form — for pending_assignment inspections */}
      {status === 'pending_assignment' && (
        <Card
          size="small"
          title={<><UserOutlined /> Assign Inspector</>}
          style={{ marginBottom: 16 }}
        >
          <Alert
            type="info"
            message="This inspection was auto-created after all permit payments were completed. Please assign an inspector and schedule a date."
            style={{ marginBottom: 12 }}
            showIcon
          />
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Inspector</Text>
              <Select
                placeholder="Select an inspector"
                style={{ width: '100%' }}
                loading={loadingInspectors}
                value={selectedInspector}
                onChange={setSelectedInspector}
                options={inspectors.map(i => ({
                  value: i._id,
                  label: `${i.firstName} ${i.lastName}${i.email ? ` (${i.email})` : ''}`,
                }))}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Scheduled Date</Text>
              <DatePicker
                style={{ width: '100%' }}
                value={selectedDate}
                onChange={setSelectedDate}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </div>
            <Button
              type="primary"
              onClick={handleAssign}
              loading={assigning}
              disabled={!selectedInspector || !selectedDate}
            >
              Assign Inspector
            </Button>
          </Space>
        </Card>
      )}

      {/* Checklist Results — for completed inspections */}
      {status === 'completed' && inspection.checklist?.length > 0 && (
        <Card size="small" title="Checklist Results" style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={inspection.checklist}
            renderItem={(item) => (
              <List.Item style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  {item.result === 'pass' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  {item.result === 'fail' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  {(item.result === 'pending' || item.result === 'na') && <ClockCircleOutlined style={{ color: '#999' }} />}
                  <Text style={{ flex: 1 }}>{item.label}</Text>
                  <Tag color={item.result === 'pass' ? 'success' : item.result === 'fail' ? 'error' : 'default'}>
                    {item.result}
                  </Tag>
                </div>
                {item.remarks && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 24, display: 'block' }}>{item.remarks}</Text>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Violations — for completed inspections */}
      {status === 'completed' && (violations.length > 0 || (inspection.violationsFound?.length > 0)) && (
        <Card
          size="small"
          title={<><WarningOutlined style={{ color: '#faad14' }} /> Violations Found</>}
          style={{ marginBottom: 16 }}
        >
          {loadingViolations ? (
            <Spin size="small" />
          ) : (
            <List
              size="small"
              dataSource={violations.length > 0 ? violations : (inspection.violationsFound || [])}
              renderItem={(v, idx) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Tag color={SEVERITY_COLORS[v.severity] || 'default'}>{v.severity}</Tag>
                      <Text strong>{v.violationType || v.type || `Violation ${idx + 1}`}</Text>
                      {v.status && <Tag>{v.status}</Tag>}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Text>
                    {v.complianceDeadline && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        Deadline: {dayjs(v.complianceDeadline).format('MMM D, YYYY')}
                      </Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      {/* Re-inspection scheduling — for failed or needs_reinspection */}
      {status === 'completed' && ['failed', 'needs_reinspection'].includes(inspection.overallResult) && (
        <Card
          size="small"
          title={<><ReloadOutlined /> Schedule Re-inspection</>}
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Inspector</Text>
              <Select
                placeholder="Select an inspector"
                style={{ width: '100%' }}
                loading={loadingInspectors}
                value={selectedInspector}
                onChange={setSelectedInspector}
                onFocus={() => { if (!inspectors.length) fetchInspectors() }}
                options={inspectors.map(i => ({
                  value: i._id,
                  label: `${i.firstName} ${i.lastName}${i.email ? ` (${i.email})` : ''}`,
                }))}
                showSearch
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Re-inspection Date</Text>
              <DatePicker
                style={{ width: '100%' }}
                value={selectedDate}
                onChange={setSelectedDate}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </div>
            <Button
              type="primary"
              onClick={handleScheduleReinspection}
              loading={assigning}
              disabled={!selectedInspector || !selectedDate}
              icon={<ReloadOutlined />}
            >
              Schedule Re-inspection
            </Button>
          </Space>
        </Card>
      )}

      {/* Notes */}
      {inspection.notes && (
        <Card size="small" title="Inspector Notes" style={{ marginBottom: 16 }}>
          <Text>{inspection.notes}</Text>
        </Card>
      )}
    </div>
  )
}
