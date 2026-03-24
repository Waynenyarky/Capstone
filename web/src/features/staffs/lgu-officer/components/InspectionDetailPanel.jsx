import React, { useState, useEffect } from 'react'
import {
  Typography, Card, Tag, Descriptions, Button, Select, DatePicker,
  Space, Alert, List, Spin, Empty, message, theme, Image,
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

export default function InspectionDetailPanel({ inspection: inspectionProp, onReviewComplete }) {
  const { token } = theme.useToken()
  const [fullDetail, setFullDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [inspectors, setInspectors] = useState([])
  const [loadingInspectors, setLoadingInspectors] = useState(false)
  const [selectedInspector, setSelectedInspector] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [violations, setViolations] = useState([])
  const [loadingViolations, setLoadingViolations] = useState(false)

  // Merge prop with fetched full detail — full detail wins for fields it has
  const inspection = fullDetail ? { ...inspectionProp, ...fullDetail } : inspectionProp

  const status = inspection?.status || 'pending'
  const statusCfg = STATUS_CONFIG[status] || { color: 'default', label: status }

  // Fetch full inspection detail on mount / when inspection changes
  useEffect(() => {
    const inspectionId = inspectionProp?._id || inspectionProp?.id
    if (!inspectionId) { setFullDetail(null); return }
    let cancelled = false
    setDetailLoading(true)
    get(`/api/lgu-officer/inspections/${inspectionId}`, { skipAutoLogout: true })
      .then((res) => {
        if (cancelled) return
        const data = res?.inspection || res?.data || res
        setFullDetail(data)
        // Also populate violations from the detail response
        if (data?.violations?.length) setViolations(data.violations)
      })
      .catch(() => { if (!cancelled) setFullDetail(null) })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
  }, [inspectionProp?._id, inspectionProp?.id])

  // Fetch inspectors when in pending_assignment state
  useEffect(() => {
    if (status === 'pending_assignment') {
      fetchInspectors()
    }
  }, [status])

  // Fetch violations when inspection is completed (fallback if detail didn't include them)
  useEffect(() => {
    if (status === 'completed' && inspection?._id && violations.length === 0) {
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
      await put(`/api/lgu-officer/inspections/${inspection._id}/assign`, {
        inspectorId: selectedInspector,
        scheduledDate: selectedDate.toISOString(),
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

  if (!inspectionProp) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="No inspection selected" />
      </div>
    )
  }

  const evidenceItems = inspection.evidence || []
  const ack = inspection.ownerAcknowledgment || {}
  const hasAcknowledged = Boolean(ack.acknowledged)

  return (
    <Spin spinning={detailLoading} tip="Loading inspection details...">
    <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
      {/* Status + type header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
          {inspection.parentInspectionId && <Tag color="purple">Follow-up</Tag>}
        </div>
        {inspection.inspectionType && (
          <Text type="secondary">
            Type: {inspection.inspectionType} · Permit: {inspection.permitType || 'N/A'}
          </Text>
        )}
      </div>

      {/* Business Info — from full detail */}
      {inspection.businessName && (
        <Card size="small" style={{ marginBottom: 16, background: token.colorBgLayout }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Business">{inspection.businessName}</Descriptions.Item>
            {inspection.businessAddress && (
              <Descriptions.Item label="Address">
                {typeof inspection.businessAddress === 'object'
                  ? (inspection.businessAddress.full || [inspection.businessAddress.streetAddress, inspection.businessAddress.barangayName, inspection.businessAddress.cityName].filter(Boolean).join(', '))
                  : inspection.businessAddress}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Inspection Details */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Inspector">
            {inspection.inspectorName || (inspection.inspectorId && typeof inspection.inspectorId === 'object' ? `${inspection.inspectorId.firstName || ''} ${inspection.inspectorId.lastName || ''}`.trim() : null) || 'Not assigned'}
          </Descriptions.Item>
          <Descriptions.Item label="Scheduled">
            {inspection.scheduledDate ? dayjs(inspection.scheduledDate).format('MMM D, YYYY') : 'Not scheduled'}
            {inspection.scheduledTimeWindow && <Text type="secondary" style={{ marginLeft: 4 }}>({inspection.scheduledTimeWindow})</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned By">
            {inspection.assignedByName || inspection.assignedBy || 'System'}
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

      {/* Owner Acknowledgment Status */}
      {status === 'completed' && (
        <Alert
          type={hasAcknowledged ? 'success' : 'warning'}
          showIcon
          message={hasAcknowledged ? 'Owner has acknowledged inspection results' : 'Owner has NOT acknowledged inspection results'}
          description={hasAcknowledged && ack.timestamp ? `Acknowledged on ${dayjs(ack.timestamp).format('MMM D, YYYY h:mm A')}` : hasAcknowledged ? undefined : 'The business owner has not yet acknowledged the results of this inspection.'}
          style={{ marginBottom: 16 }}
        />
      )}

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
                  label: i.name || `${i.firstName || ''} ${i.lastName || ''}`.trim() || i.email || 'Inspector',
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
          title={<><WarningOutlined style={{ color: '#faad14' }} /> Violations ({violations.length || inspection.violationsFound?.length || 0})</>}
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
                      <Tag color={v.status === 'resolved' ? 'success' : v.status === 'open' ? 'error' : 'default'}>{v.status || 'open'}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Text>
                    {v.complianceDeadline && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        Deadline: {dayjs(v.complianceDeadline).format('MMM D, YYYY')}
                        {v.status === 'open' && dayjs(v.complianceDeadline).isBefore(dayjs()) && (
                          <Tag color="error" style={{ marginLeft: 4 }}>Overdue</Tag>
                        )}
                      </Text>
                    )}
                    {v.legalBasis && (
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Legal basis: {v.legalBasis}</Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      {/* Evidence Photos — from inspector mobile app */}
      {evidenceItems.length > 0 && (
        <Card size="small" title={`Evidence (${evidenceItems.length})`} style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {evidenceItems.map((ev, idx) => {
                const src = ev.url || ev.filePath || ev.cid || ''
                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(src) || ev.type?.startsWith('image')
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {isImage ? (
                      <Image
                        width={80}
                        height={80}
                        src={src}
                        style={{ objectFit: 'cover', borderRadius: 4, border: `1px solid ${token.colorBorderSecondary}` }}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='11'%3ENo preview%3C/text%3E%3C/svg%3E"
                      />
                    ) : (
                      <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout, borderRadius: 4, border: `1px solid ${token.colorBorderSecondary}` }}>
                        <Text type="secondary" style={{ fontSize: 10, textAlign: 'center' }}>{ev.name || ev.fileName || `File ${idx + 1}`}</Text>
                      </div>
                    )}
                    {ev.description && <Text type="secondary" style={{ fontSize: 10, maxWidth: 80, textAlign: 'center' }}>{ev.description}</Text>}
                  </div>
                )
              })}
            </div>
          </Image.PreviewGroup>
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
                  label: i.name || `${i.firstName || ''} ${i.lastName || ''}`.trim() || i.email || 'Inspector',
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

      {/* GPS Check — if location data exists */}
      {inspection.gpsCheck && (
        <Card size="small" title="GPS Verification" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Status">
              <Tag color={inspection.gpsCheck.matched ? 'success' : 'warning'}>
                {inspection.gpsCheck.matched ? 'Location matched' : 'Location mismatch'}
              </Tag>
            </Descriptions.Item>
            {inspection.gpsCheck.distanceMeters != null && (
              <Descriptions.Item label="Distance">{Math.round(inspection.gpsCheck.distanceMeters)}m from registered address</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Edit History — timeline of changes */}
      {inspection.editHistory?.length > 0 && (
        <Card size="small" title="Inspection History" style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={inspection.editHistory}
            renderItem={(entry, idx) => (
              <List.Item style={{ padding: '4px 0' }}>
                <div>
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>{entry.action || entry.event || 'Update'}</Text>
                    {entry.by && <Text type="secondary"> by {entry.by}</Text>}
                  </Text>
                  {entry.at && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{dayjs(entry.at).format('MMM D, YYYY h:mm A')}</Text>}
                  {entry.details && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{entry.details}</Text>}
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
    </Spin>
  )
}
