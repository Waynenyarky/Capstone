import { useState } from 'react'
import dayjs from 'dayjs'

const EVENT_TYPE_LABELS = {
  claim: 'Claimed',
  release: 'Released',
  status_update: 'Status Changed',
  field_review: 'Field Reviewed',
  payment_generated: 'Payment Generated',
  appeal_submitted: 'Appeal Submitted',
  appeal_resolved: 'Appeal Resolved',
  clearance_initiated: 'Clearance Initiated',
  permit_issued: 'Permit Issued',
  document_uploaded: 'Document Uploaded',
}

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  resubmit: 'Resubmitted',
  approved: 'Approved',
  rejected: 'Rejected',
  appeal_pending: 'Appeal Pending',
}

export function useApplicationAuditExport(audits, onClose) {
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
      if (metadata.fieldKey) {
        details += `Field: ${metadata.fieldKey} - ${metadata.decision || 'reviewed'}`
      }
      if (metadata.paymentCount) {
        details += `Generated ${metadata.paymentCount} payment line items`
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
    link.setAttribute('download', `application-audit-export-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`)
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
