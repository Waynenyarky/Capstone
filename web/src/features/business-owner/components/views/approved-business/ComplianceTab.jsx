import { useState, useCallback, useEffect } from 'react'
import { Typography, Card, Table, Empty, Button, Tag, Alert, Space, Drawer, Select, Row, Col, Segmented, Calendar, Badge, Descriptions, App, Statistic } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { getInspections, getInspection as getInspectionDetail, acknowledgeInspection } from '../../../services/inspectionsService'
import { getViolations, acknowledgeViolation, getViolationSummary } from '../../../services/violationsService'
import { formatDate } from '../../../utils/formatters.js'

const { Title, Text } = Typography

export default function ComplianceTab({ businessId }) {
  const { message: msg } = App.useApp()
  const [inspections, setInspections] = useState([])
  const [violations, setViolations] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [violationStatusFilter, setViolationStatusFilter] = useState('all')
  const [inspectionFilter, setInspectionFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [ackLoading, setAckLoading] = useState(null)
  const [inspectionAckLoading, setInspectionAckLoading] = useState(null)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true)
    Promise.all([
      getInspections({ businessId }).catch(() => []),
      getViolations({ businessId }).catch(() => []),
      getViolationSummary().catch(() => null),
    ]).then(([ins, vio, sum]) => {
      setInspections(Array.isArray(ins) ? ins : ins?.inspections || ins?.data || [])
      setViolations(Array.isArray(vio) ? vio : vio?.violations || vio?.data || [])
      setSummary(sum)
    }).finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAcknowledge = async (violationId) => {
    setAckLoading(violationId)
    try {
      await acknowledgeViolation(violationId)
      msg.success('Violation acknowledged')
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to acknowledge')
    } finally {
      setAckLoading(null)
    }
  }

  const handleInspectionDetail = async (record) => {
    const id = record._id || record.inspectionId
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const data = await getInspectionDetail(id)
      setDetailData(data)
    } catch {
      setDetailData(record)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleInspectionAcknowledge = async (inspectionId) => {
    setInspectionAckLoading(inspectionId)
    try {
      await acknowledgeInspection(inspectionId)
      msg.success('Inspection acknowledged')
      if (detailData && (detailData._id === inspectionId || detailData.id === inspectionId)) {
        setDetailData((prev) => ({
          ...prev,
          ownerAcknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          ownerAcknowledgment: {
            ...(prev?.ownerAcknowledgment || {}),
            acknowledged: true,
            timestamp: new Date().toISOString(),
          },
        }))
      }
      fetchData()
    } catch (err) {
      msg.error(err?.message || 'Failed to acknowledge inspection')
    } finally {
      setInspectionAckLoading(null)
    }
  }

  const now = dayjs()
  const filteredInspections = inspections.filter(i => {
    if (inspectionFilter === 'upcoming') return dayjs(i.scheduledDate).isAfter(now)
    if (inspectionFilter === 'past') return dayjs(i.scheduledDate).isBefore(now)
    return true
  })

  const filteredViolations = violations.filter(v => {
    if (violationStatusFilter === 'all') return true
    return v.status === violationStatusFilter
  })

  const latestCompletedInspection = [...inspections]
    .filter((i) => i.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.scheduledDate || 0) - new Date(a.completedAt || a.scheduledDate || 0))[0]

  const latestOutcomeLabel = latestCompletedInspection?.overallResult || latestCompletedInspection?.result
  const latestOutcomeType =
    latestOutcomeLabel === 'passed'
      ? 'success'
      : latestOutcomeLabel === 'failed'
        ? 'warning'
        : latestOutcomeLabel === 'needs_reinspection'
          ? 'warning'
          : 'info'

  const inspectionCols = [
    { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: v => formatDate(v), width: 120 },
    { title: 'Type', dataIndex: 'inspectionType', key: 'type', width: 120 },
    { title: 'Result', dataIndex: 'result', key: 'result', width: 100, render: v => <Tag color={v === 'passed' ? 'success' : v === 'failed' ? 'error' : 'default'}>{v || 'Pending'}</Tag> },
    { title: 'Inspector', dataIndex: 'inspectorName', key: 'inspector', render: (v, r) => v || r.inspector?.name || 'N/A' },
    {
      title: '',
      key: 'action',
      width: 210,
      render: (_, r) => {
        const inspectionId = r._id || r.inspectionId || r.id
        const acknowledged = Boolean(r.ownerAcknowledged || r.ownerAcknowledgment?.acknowledged || r.acknowledgedAt)
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleInspectionDetail(r)} />
            {r.status === 'completed' && !acknowledged ? (
              <Button
                size="small"
                type="primary"
                loading={inspectionAckLoading === inspectionId}
                onClick={() => handleInspectionAcknowledge(inspectionId)}
              >
                Acknowledge
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const violationCols = [
    { title: 'Type', dataIndex: 'violationType', key: 'type' },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 100, render: v => <Tag color={v === 'critical' ? 'error' : v === 'major' ? 'warning' : 'default'}>{v || 'N/A'}</Tag> },
    { title: 'Deadline', dataIndex: 'complianceDeadline', key: 'deadline', render: v => formatDate(v), width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={v === 'resolved' ? 'success' : v === 'open' ? 'error' : 'processing'}>{v || 'N/A'}</Tag> },
    {
      title: '', key: 'action', width: 110,
      render: (_, r) => r.status === 'open' ? (
        <Button size="small" loading={ackLoading === (r._id || r.violationId)} onClick={() => handleAcknowledge(r._id || r.violationId)}>Acknowledge</Button>
      ) : null,
    },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><LottieSpinner /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {latestCompletedInspection ? (
        <Alert
          type={latestOutcomeType}
          showIcon
          message={`Latest inspection outcome: ${latestOutcomeLabel || 'completed'}`}
          description={`Inspection date: ${formatDate(latestCompletedInspection.completedAt || latestCompletedInspection.scheduledDate)}${latestCompletedInspection.ownerAcknowledged || latestCompletedInspection.ownerAcknowledgment?.acknowledged ? ' • Acknowledged' : ' • Action required: acknowledge result'}`}
        />
      ) : null}
      {summary && (
        <Row gutter={16}>
          <Col xs={8}><Statistic title="Open" value={summary.open ?? 0} valueStyle={{ color: '#cf1322' }} /></Col>
          <Col xs={8}><Statistic title="Resolved" value={summary.resolved ?? 0} valueStyle={{ color: '#3f8600' }} /></Col>
          <Col xs={8}><Statistic title="Appealed" value={summary.appealed ?? 0} valueStyle={{ color: '#faad14' }} /></Col>
        </Row>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Inspections</Title>
          <Segmented options={[{ label: 'All', value: 'all' }, { label: 'Upcoming', value: 'upcoming' }, { label: 'Past', value: 'past' }]} value={inspectionFilter} onChange={setInspectionFilter} size="small" />
        </div>
        <Table size="small" rowKey={r => r._id || r.inspectionId} columns={inspectionCols} dataSource={filteredInspections} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No inspections recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>
      {inspections.length > 0 && (
        <Card size="small" title="Inspection Schedule">
          <Calendar
            fullscreen={false}
            cellRender={(date) => {
              const dateStr = date.format('YYYY-MM-DD')
              const dayInspections = inspections.filter(i => dayjs(i.scheduledDate).format('YYYY-MM-DD') === dateStr)
              if (!dayInspections.length) return null
              return (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {dayInspections.map((i, idx) => (
                    <li key={idx}>
                      <Badge
                        status={i.status === 'completed' ? (i.overallResult === 'passed' || i.result === 'passed' ? 'success' : 'error') : i.status === 'in_progress' ? 'processing' : 'warning'}
                        text={<span style={{ fontSize: 10 }}>{i.inspectionType || 'Inspection'}</span>}
                      />
                    </li>
                  ))}
                </ul>
              )
            }}
          />
        </Card>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>Violations</Title>
          <Select size="small" value={violationStatusFilter} onChange={setViolationStatusFilter} style={{ width: 130 }} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'appealed', label: 'Appealed' }]} />
        </div>
        <Table size="small" rowKey={r => r._id || r.violationId} columns={violationCols} dataSource={filteredViolations} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="No violations recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} />
      </div>

      <Drawer title="Inspection Detail" open={detailOpen} onClose={() => setDetailOpen(false)} width={520}>
        {detailLoading ? <LottieSpinner /> : detailData ? (() => {
          const d = detailData
          const isAck = d.ownerAcknowledged || d.ownerAcknowledgment?.acknowledged
          const checklist = d.checklist || []
          const detailViolations = d.violationsFound || d.violations || []
          const evidence = d.evidence || []
          const inspId = d._id || d.inspectionId || d.id

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Date">{formatDate(d.scheduledDate)}</Descriptions.Item>
                <Descriptions.Item label="Type">{d.inspectionType || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={d.status === 'completed' ? 'success' : d.status === 'in_progress' ? 'processing' : d.status === 'pending' ? 'warning' : 'default'}>{d.status || 'Pending'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Result">
                  {(d.result || d.overallResult)
                    ? <Tag color={(d.result || d.overallResult) === 'passed' ? 'success' : (d.result || d.overallResult) === 'failed' ? 'error' : 'warning'}>{d.result || d.overallResult}</Tag>
                    : 'Pending'}
                </Descriptions.Item>
                <Descriptions.Item label="Inspector">{d.inspectorName || d.inspector?.name || 'N/A'}</Descriptions.Item>
                {d.completedAt && <Descriptions.Item label="Completed">{dayjs(d.completedAt).format('MMM D, YYYY h:mm A')}</Descriptions.Item>}
                <Descriptions.Item label="Acknowledgment">
                  {isAck
                    ? <Tag color="success">Acknowledged on {formatDate(d.acknowledgedAt || d.ownerAcknowledgment?.timestamp)}</Tag>
                    : <Tag color="warning">Not yet acknowledged</Tag>}
                </Descriptions.Item>
              </Descriptions>

              {d.status === 'completed' && !isAck && (
                <Alert
                  type="warning"
                  showIcon
                  message="Action required: Acknowledge this inspection result"
                  description="By acknowledging, you confirm that you have reviewed the inspection outcome."
                  action={
                    <Button
                      type="primary"
                      size="small"
                      loading={inspectionAckLoading === inspId}
                      onClick={() => handleInspectionAcknowledge(inspId)}
                    >
                      Acknowledge
                    </Button>
                  }
                />
              )}

              {d.notes && (
                <Card size="small" title="Inspector Notes">
                  <Text>{d.notes}</Text>
                </Card>
              )}

              {checklist.length > 0 && (
                <Card size="small" title="Checklist Results">
                  {checklist.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: idx < checklist.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <Tag color={item.result === 'pass' ? 'success' : item.result === 'fail' ? 'error' : 'default'} style={{ minWidth: 44, textAlign: 'center' }}>{item.result}</Tag>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13 }}>{item.label}</Text>
                        {item.remarks && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{item.remarks}</Text>}
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              {detailViolations.length > 0 && (
                <Card size="small" title={`Violations (${detailViolations.length})`}>
                  {detailViolations.map((v, idx) => (
                    <div key={idx} style={{ padding: '6px 0', borderBottom: idx < detailViolations.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Tag color={v.severity === 'critical' ? 'error' : v.severity === 'major' ? 'warning' : 'default'}>{v.severity}</Tag>
                        <Text strong>{v.violationType || `Violation ${idx + 1}`}</Text>
                        <Tag color={v.status === 'resolved' ? 'success' : v.status === 'open' ? 'error' : 'default'}>{v.status || 'open'}</Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Text>
                      {v.complianceDeadline && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                          Deadline: {formatDate(v.complianceDeadline)}
                          {v.status === 'open' && dayjs(v.complianceDeadline).isBefore(dayjs()) && <Tag color="error" style={{ marginLeft: 4 }}>Overdue</Tag>}
                        </Text>
                      )}
                    </div>
                  ))}
                </Card>
              )}

              {evidence.length > 0 && (
                <Card size="small" title={`Evidence (${evidence.length})`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {evidence.map((ev, idx) => {
                      const src = ev.url || ev.filePath || ev.cid || ''
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(src) || ev.type?.startsWith('image')
                      return (
                        <div key={idx} style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                          {isImage
                            ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Text type="secondary" style={{ fontSize: 9, textAlign: 'center', padding: 2 }}>{ev.name || ev.fileName || `File ${idx + 1}`}</Text>}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {d.gpsCheck && (
                <Card size="small" title="GPS Verification">
                  <Tag color={d.gpsCheck.matched ? 'success' : 'warning'}>
                    {d.gpsCheck.matched ? 'Location matched' : 'Location mismatch'}
                  </Tag>
                  {d.gpsCheck.distanceMeters != null && <Text type="secondary" style={{ marginLeft: 8 }}>{Math.round(d.gpsCheck.distanceMeters)}m from registered address</Text>}
                </Card>
              )}
            </div>
          )
        })() : <Empty />}
      </Drawer>
    </div>
  )
}
