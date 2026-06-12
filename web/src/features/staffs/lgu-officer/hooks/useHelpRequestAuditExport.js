import { useState } from 'react'
import dayjs from 'dayjs'

const EVENT_TYPE_LABELS = {
  claim: 'Claimed',
  release: 'Released',
  status_update: 'Status Changed',
  priority_update: 'Priority Changed',
}

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  needs_response: 'Needs Response',
  waiting_for_business_owner: 'Waiting for Owner',
  closed: 'Closed',
  invalid: 'Invalid',
}

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

export function useHelpRequestAuditExport(audits, onClose) {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportRange, setExportRange] = useState([null, null])

  const filteredAuditsByRange = () => {
    if (!exportRange || !exportRange[0] || !exportRange[1]) return []
    const [start, end] = exportRange
    return audits.filter((audit) => {
      const auditDate = dayjs(audit.timestamp)
      return auditDate.isAfter(start.startOf('day')) && auditDate.isBefore(end.endOf('day'))
    })
  }

  const rowCount = filteredAuditsByRange().length

  const handleExport = () => {
    const filtered = filteredAuditsByRange()
    if (filtered.length === 0) return

    const headers = ['Timestamp', 'User ID', 'Event Type', 'Details']
    const rows = filtered.map((audit) => {
      const metadata = audit.metadata || {}
      let details = ''

      if (metadata.claimedByName) {
        details += `Claimed by: ${metadata.claimedByName}`
      }
      if (metadata.releasedByName) {
        details += `Released by: ${metadata.releasedByName}`
      }
      if (metadata.override) {
        details += `Overrode: ${metadata.override.fromName || metadata.override.from}`
      }
      if (metadata.status) {
        details += `Status: ${STATUS_LABELS[metadata.status.from] || metadata.status.from} → ${STATUS_LABELS[metadata.status.to] || metadata.status.to}`
      }
      if (metadata.priority) {
        details += `Priority: ${PRIORITY_LABELS[metadata.priority.from] || metadata.priority.from} → ${PRIORITY_LABELS[metadata.priority.to] || metadata.priority.to}`
      }

      const escapeCsv = (val) => {
        if (!val) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      return [
        dayjs(audit.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        audit.userId || 'Unknown',
        EVENT_TYPE_LABELS[audit.eventType] || audit.eventType,
        escapeCsv(details),
      ]
    })

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `help-request-audit-export-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setExportOpen(false)
    onClose?.()
  }

  return {
    exportOpen,
    setExportOpen,
    exportRange,
    setExportRange,
    handleExport,
    rowCount,
  }
}
