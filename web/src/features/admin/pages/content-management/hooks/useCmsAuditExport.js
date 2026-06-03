import { useState } from 'react'
import dayjs from 'dayjs'

export function useCmsAuditExport(audits, onClose) {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportRange, setExportRange] = useState([null, null])

  const filteredAuditsByRange = () => {
    if (!exportRange || !exportRange[0] || !exportRange[1]) return []
    const [start, end] = exportRange
    return audits.filter((audit) => {
      const auditDate = dayjs(audit.createdAt)
      return auditDate.isAfter(start.startOf('day')) && auditDate.isBefore(end.endOf('day'))
    })
  }

  const rowCount = filteredAuditsByRange().length

  const handleExport = () => {
    const filtered = filteredAuditsByRange()
    if (filtered.length === 0) return

    const headers = ['Timestamp', 'User', 'Event Type', 'Changed Fields', 'Slot ID', 'Previous Value', 'New Value']
    const rows = filtered.map((audit) => {
      const user = audit.userId
        ? `${audit.userId.firstName || ''} ${audit.userId.lastName || ''}`.trim() || audit.userId.email || 'Unknown'
        : 'Unknown'
      const changedFields = audit.metadata?.changedFields?.join(', ') || 'N/A'

      let previousValue = ''
      let newValue = ''
      try {
        previousValue = audit.oldValue ? JSON.stringify(JSON.parse(audit.oldValue), null, 2) : ''
        newValue = audit.newValue ? JSON.stringify(JSON.parse(audit.newValue), null, 2) : ''
      } catch {
        previousValue = audit.oldValue || ''
        newValue = audit.newValue || ''
      }

      // Escape quotes and wrap in quotes for CSV
      const escapeCsv = (val) => {
        if (!val) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      return [
        dayjs(audit.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        user,
        audit.eventType,
        changedFields,
        audit.metadata?.slotId || 'N/A',
        escapeCsv(previousValue),
        escapeCsv(newValue),
      ]
    })

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `cms-audit-export-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`)
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
