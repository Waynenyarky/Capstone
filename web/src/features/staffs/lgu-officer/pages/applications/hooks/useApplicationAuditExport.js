import { useState } from 'react'
import dayjs from 'dayjs'

const EVENT_TYPE_LABELS = {
  claim: 'Claimed',
  release: 'Released',
  status_update: 'Status Changed',
  field_review: 'Field Reviewed',
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

    const headers = [
      'Timestamp',
      'User ID',
      'Event Type',
      'Officer/User',
      'Application ID',
      'Application Status',
      'Status Change',
      'Field Key',
      'Decision',
      'Action Type',
      'Reason',
      'Comments',
      'Override',
    ]

    const rows = filtered.map((audit) => {
      const metadata = audit.metadata || {}

      const escapeCsv = (val) => {
        if (!val) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const formatStatusChange = () => {
        if (!metadata.status) return ''
        const from = STATUS_LABELS[metadata.status.from] || metadata.status.from
        const to = STATUS_LABELS[metadata.status.to] || metadata.status.to
        return `${from} → ${to}`
      }

      const formatOverride = () => {
        if (!metadata.override) return ''
        return `Overrode: ${metadata.override.fromName || metadata.override.from}`
      }

      const formatDecisions = () => {
        if (!metadata.decisions || !Array.isArray(metadata.decisions)) return ''
        return metadata.decisions.map(d => `${d.fieldKey}: ${d.status}`).join('; ')
      }

      return [
        dayjs(audit.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        audit.userId || 'Unknown',
        EVENT_TYPE_LABELS[audit.eventType] || audit.eventType,
        escapeCsv(metadata.officerName || metadata.claimedByName || metadata.releasedByName || metadata.reviewedByName || metadata.submittedByName || ''),
        escapeCsv(metadata.applicationId || ''),
        escapeCsv(STATUS_LABELS[metadata.applicationStatus] || metadata.applicationStatus || ''),
        escapeCsv(formatStatusChange()),
        escapeCsv(metadata.fieldKey || ''),
        escapeCsv(metadata.decision || formatDecisions()),
        escapeCsv(metadata.actionType || ''),
        escapeCsv(metadata.reasonCode || metadata.requestCode || ''),
        escapeCsv(metadata.reasonOther || metadata.requestOther || metadata.comments || ''),
        escapeCsv(formatOverride()),
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
