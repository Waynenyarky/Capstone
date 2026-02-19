import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Table,
  Tag,
  Select,
  message,
  Splitter,
  Grid,
  Pagination,
  Empty,
  Typography,
  Modal,
  theme,
} from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { fetchTamperIncidents } from '@/features/admin/services/tamperService'
import IncidentDetailPanel from './IncidentDetailPanel'

const { Text } = Typography

const statusColors = { new: 'red', acknowledged: 'gold', resolved: 'green' }
const severityColors = { high: 'red', medium: 'orange', low: 'blue' }

const STATUS_ORDER = { new: 0, acknowledged: 1, resolved: 2 }
const PAGE_SIZE = 20
const FETCH_LIMIT = 500

export default function AuditTamperIncidentsTab({ onRefresh, initialIncidentId }) {
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [severityFilter, setSeverityFilter] = useState(undefined)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: FETCH_LIMIT }
      if (statusFilter) params.status = statusFilter
      if (severityFilter) params.severity = severityFilter
      const res = await fetchTamperIncidents(params)
      const list = res?.incidents ?? []
      setIncidents(list)
    } catch {
      message.error('Failed to load tamper incidents')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter])

  useEffect(() => {
    load()
  }, [load])

  const sortedIncidents = useMemo(() => {
    const list = [...(incidents || [])]
    list.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 3
      const orderB = STATUS_ORDER[b.status] ?? 3
      if (orderA !== orderB) return orderA - orderB
      const dateA = a.detectedAt ? new Date(a.detectedAt).getTime() : 0
      const dateB = b.detectedAt ? new Date(b.detectedAt).getTime() : 0
      return dateB - dateA
    })
    return list
  }, [incidents])

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return undefined
    const handler = (event) => {
      const { action: evAction, status, severity } = event?.detail || {}
      if (evAction === 'setIncidentFilter') {
        if (status !== undefined) setStatusFilter(status)
        if (severity !== undefined) setSeverityFilter(severity)
      } else if (evAction === 'selectFirstIncident') {
        const first = sortedIncidents[0]
        if (first) setSelectedIncident(first)
      }
    }
    window.addEventListener('devtools:audittamper', handler)
    return () => window.removeEventListener('devtools:audittamper', handler)
  }, [sortedIncidents])

  useEffect(() => {
    if (selectedIncident && incidents.length) {
      const updated = incidents.find((r) => r.id === selectedIncident.id)
      if (updated) setSelectedIncident(updated)
      else setSelectedIncident(null)
    }
  }, [incidents])

  useEffect(() => {
    if (!initialIncidentId || !incidents.length) return
    const rec = incidents.find(
      (r) =>
        r.id === initialIncidentId ||
        r._id === initialIncidentId ||
        String(r.id || r._id) === String(initialIncidentId)
    )
    if (rec) setSelectedIncident(rec)
  }, [initialIncidentId, incidents])

  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedIncidents.slice(start, start + PAGE_SIZE)
  }, [sortedIncidents, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, severityFilter])

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
  ]

  const tableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: 12,
          paddingBottom: 0,
        }}
      >
        <Select
          placeholder="Status"
          allowClear
          style={{ width: '100%' }}
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

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div
          style={{
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Table
            rowKey={(rec) => rec.id}
            dataSource={paginatedIncidents}
            columns={columns}
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(rec) => (rec?.id === selectedIncident?.id ? 'incident-row-selected' : '')}
            onRow={(rec) => ({
              onClick: () => setSelectedIncident(rec),
              style: { cursor: 'pointer' },
            })}
            locale={{
              emptyText: (
                <Empty
                  image={<ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  styles={{ image: { height: 60 } }}
                  description={<Text type="secondary">No incidents</Text>}
                />
              ),
            }}
          />
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={sortedIncidents.length}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
      <style>{`
        .ant-table-tbody > tr.incident-row-selected > td {
          background: var(--row-selected-bg) !important;
        }
        .ant-table-tbody > tr:hover > td {
          cursor: pointer;
        }
      `}</style>
    </div>
  )

  const detailPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <IncidentDetailPanel incident={selectedIncident} onRefresh={load} />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {tableContent}
        <Modal
          title={selectedIncident?.message ? (selectedIncident.message.slice(0, 50) + (selectedIncident.message.length > 50 ? '…' : '')) : 'Incident detail'}
          open={!!selectedIncident}
          onCancel={() => setSelectedIncident(null)}
          footer={null}
          destroyOnHidden
          width="90%"
        >
          {selectedIncident && <IncidentDetailPanel incident={selectedIncident} onRefresh={load} />}
        </Modal>
      </>
    )
  }

  return (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {tableContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {detailPanel}
      </Splitter.Panel>
    </Splitter>
  )
}
