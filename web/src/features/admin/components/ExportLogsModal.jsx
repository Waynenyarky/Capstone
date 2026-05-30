import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal, DatePicker, Button, Typography, Alert } from 'antd'
import LottieSpinner from '@/shared/components/LottieSpinner.jsx'
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getAllAuditLogsAdmin } from '../services/auditService'
import { getFormDefinitionsAuditLog } from '../services/formDefinitionService'
import { get } from '@/lib/http.js'

const { RangePicker } = DatePicker
const { Text } = Typography

const EXPORT_LIMIT = 5000
const USER_PAGE_SIZE = 100

const SECURITY_EVENT_TYPES = new Set([
  'security_event',
  'restricted_field_attempt',
  'account_lockout',
  'account_unlock',
  'account_deletion_requested',
  'account_deletion_approved',
  'account_deletion_denied',
  'account_deletion_scheduled',
  'account_deletion_finalized',
  'account_deletion_undone',
  'admin_deletion_requested',
  'admin_deletion_approved',
  'admin_deletion_denied',
  'admin_approval_request',
  'admin_approval_approved',
  'admin_approval_rejected',
  'account_recovery_initiated',
  'account_recovery_completed',
  'error_critical',
])

function csvEscape (val) {
  const s = String(val ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

function exportTypeLabel (exportType) {
  if (exportType === 'users') return 'User management'
  if (exportType === 'forms') return 'Form definitions'
  if (exportType === 'security') return 'Security'
  if (exportType === 'permit-forms') return 'Forms and Requirements'
  return 'Fee configuration'
}

export default function ExportLogsModal ({ open, onClose, exportType, title }) {
  const [dateRange, setDateRange] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [availability, setAvailability] = useState(null)
  const [error, setError] = useState(null)
  const fetchRef = useRef(null)

  const label = title || exportTypeLabel(exportType) + ' logs'

  const fetchAvailability = useCallback(async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) {
      setAvailability(null)
      return
    }
    const start = dateRange[0].startOf('day').toISOString()
    const end = dateRange[1].endOf('day').toISOString()
    setLoading(true)
    setError(null)
    fetchRef.current = { start, end }
    try {
      if (exportType === 'users') {
        const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: 1, skip: 0 })
        const total = res?.total ?? 0
        setAvailability({ total, hasData: total > 0 })
      } else if (exportType === 'security') {
        const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: EXPORT_LIMIT })
        const logs = res?.logs || []
        const securityOnly = logs.filter((log) => SECURITY_EVENT_TYPES.has(log.eventType))
        setAvailability({ total: securityOnly.length, hasData: securityOnly.length > 0 })
      } else if (exportType === 'forms') {
        const res = await getFormDefinitionsAuditLog({ limit: 200 })
        const entries = res?.entries || []
        const startT = dateRange[0].startOf('day').valueOf()
        const endT = dateRange[1].endOf('day').valueOf()
        const inRange = entries.filter((e) => {
          const t = e.at ? new Date(e.at).getTime() : 0
          return t >= startT && t <= endT
        })
        setAvailability({ total: inRange.length, hasData: inRange.length > 0 })
      } else if (exportType === 'permit-forms') {
        const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: EXPORT_LIMIT })
        const logs = res?.logs || []
        const permitFormsOnly = logs.filter((log) => 
          log.eventType === 'permit_forms_published' || 
          log.eventType === 'permit_forms_reverted' || 
          log.eventType === 'permit_forms_toggled'
        )
        setAvailability({ total: permitFormsOnly.length, hasData: permitFormsOnly.length > 0 })
      } else {
        setAvailability({ total: 0, hasData: false })
      }
    } catch (err) {
      setError(err?.message || 'Failed to check availability')
      setAvailability(null)
    } finally {
      setLoading(false)
      fetchRef.current = null
    }
  }, [exportType, dateRange])

  useEffect(() => {
    if (!open) return
    setDateRange(null)
    setAvailability(null)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open || !dateRange?.[0] || !dateRange?.[1]) return
    const t = setTimeout(fetchAvailability, 300)
    return () => clearTimeout(t)
  }, [open, dateRange, fetchAvailability])

  const handleExport = useCallback(async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) return
    const start = dateRange[0].startOf('day').toISOString()
    const end = dateRange[1].endOf('day').toISOString()
    setExporting(true)
    setError(null)
    try {
      if (exportType === 'users') {
        const allRows = []
        let skip = 0
        let hasMore = true
        while (hasMore) {
          const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: USER_PAGE_SIZE, skip })
          const logs = res?.logs || []
          allRows.push(...logs)
          const total = res?.total ?? 0
          hasMore = skip + logs.length < total && allRows.length < EXPORT_LIMIT
          skip += USER_PAGE_SIZE
        }
        const headers = ['Action', 'User', 'User email', 'Performed by', 'Date']
        const rows = allRows.map((log) => [
          log.eventType || '',
          log.user || '',
          log.userEmail || '',
          log.performedBy || '',
          log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
        ])
        const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-management-logs-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (exportType === 'security') {
        const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: EXPORT_LIMIT })
        const logs = res?.logs || []
        const securityOnly = logs.filter((log) => SECURITY_EVENT_TYPES.has(log.eventType))
        const headers = ['Action', 'User', 'User email', 'Performed by', 'Date']
        const rows = securityOnly.map((log) => [
          log.eventType || '',
          log.user || '',
          log.userEmail || '',
          log.performedBy || '',
          log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
        ])
        const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-logs-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (exportType === 'forms') {
        const res = await getFormDefinitionsAuditLog({ limit: 50 })
        const entries = res?.entries || []
        const startT = dateRange[0].startOf('day').valueOf()
        const endT = dateRange[1].endOf('day').valueOf()
        const inRange = entries.filter((e) => {
          const t = e.at ? new Date(e.at).getTime() : 0
          return t >= startT && t <= endT
        })
        const formLabel = (e) => {
          const type = e.formType || '—'
          const ind = e.industryScope || 'All'
          const v = e.version != null ? ` v${e.version}` : ''
          return `${e.name || type} (${type} – ${ind})${v}`
        }
        const userLabel = (e) => {
          if (e?.user) {
            const n = [e.user.firstName, e.user.lastName].filter(Boolean).join(' ')
            return n || e.user.email || '—'
          }
          if (e?.system) return e.system
          return '—'
        }
        const headers = ['Action', 'Form', 'Performed by', 'Date']
        const rows = inRange.map((e) => [
          e.action || '',
          formLabel(e),
          userLabel(e),
          e.at ? dayjs(e.at).format('YYYY-MM-DD HH:mm:ss') : '',
        ])
        const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `form-definitions-logs-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (exportType === 'permit-forms') {
        const res = await getAllAuditLogsAdmin({ startDate: start, endDate: end, limit: EXPORT_LIMIT })
        const logs = res?.logs || []
        const permitFormsOnly = logs.filter((log) => 
          log.eventType === 'permit_forms_published' || 
          log.eventType === 'permit_forms_reverted' || 
          log.eventType === 'permit_forms_toggled'
        )
        const headers = ['Action', 'Admin', 'Date', 'Details']
        const rows = permitFormsOnly.map((log) => [
          log.eventType || '',
          log.userId || '',
          log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
          log.newValue ? log.newValue.substring(0, 200) : '',
        ])
        const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `permit-forms-logs-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        try {
          const res = await get(`/api/admin/fee-configuration-logs?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}&limit=${EXPORT_LIMIT}`)
          const logs = res?.data?.logs ?? res?.logs ?? []
          const headers = ['Action', 'Resource', 'Performed by', 'Date']
          const rows = (Array.isArray(logs) ? logs : []).map((log) => [
            log.action || '',
            log.resourceType === 'penalty' ? 'Penalty & Surcharge' : log.lineOfBusiness || 'Fee configuration',
            (log.user && [log.user.firstName, log.user.lastName].filter(Boolean).join(' ')) || log.user?.email || '—',
            log.at ? dayjs(log.at).format('YYYY-MM-DD HH:mm:ss') : '',
          ])
          const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `fee-configuration-logs-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`
          a.click()
          URL.revokeObjectURL(url)
        } catch {
          setError('Fee configuration logs are not available for export yet.')
          return
        }
      }
      onClose()
    } catch (err) {
      setError(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }, [exportType, dateRange, onClose])

  return (
    <Modal
      title={`Export ${label}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          disabled={!dateRange?.[0] || !dateRange?.[1] || loading}
          onClick={handleExport}
        >
          Export CSV
        </Button>,
      ]}
      destroyOnHidden
      width={440}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Date range
          </Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: '100%' }}
            allowClear
            format="MMM D, YYYY"
            placeholder={['Start date', 'End date']}
          />
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LottieSpinner size="small" />
            <Text type="secondary">Checking availability…</Text>
          </div>
        )}
        {!loading && availability != null && (
          <Alert
            type={availability.hasData ? 'info' : 'warning'}
            showIcon
            icon={<CalendarOutlined />}
            message={
              availability.hasData
                ? `${availability.total} log ${availability.total === 1 ? 'entry' : 'entries'} in this date range.`
                : 'No log entries in this date range.'
            }
          />
        )}
        {exportType === 'forms' && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Form definition history is limited to the most recent entries. Only entries within the selected range are exported.
          </Text>
        )}
        {exportType === 'fee' && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Fee configuration logs export will be available when the backend supports it.
          </Text>
        )}
        {error && (
          <Alert type="error" message={error} showIcon onClose={() => setError(null)} closable />
        )}
      </div>
    </Modal>
  )
}
