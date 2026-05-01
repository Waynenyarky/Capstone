import { useState } from 'react'
import dayjs from 'dayjs'
import { getRangeFilteredApprovals, generateCsvExport } from '../utils/maintenance.utils.js'

export function useMaintenanceExport(approvals, onDownload) {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportRange, setExportRange] = useState([null, null])

  const handleExport = () => {
    if (!exportRange[0] || !exportRange[1]) return

    const filtered = getRangeFilteredApprovals(approvals, exportRange[0], exportRange[1])
    const csv = generateCsvExport(filtered)
    
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `maintenance-export-${dayjs().format('YYYY-MM-DD-HH-mm')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      onDownload?.()
    }
    
    setExportOpen(false)
    setExportRange([null, null])
  }

  const rowCount = exportRange[0] && exportRange[1]
    ? getRangeFilteredApprovals(approvals, exportRange[0], exportRange[1]).length
    : 0

  return {
    exportOpen,
    setExportOpen,
    exportRange,
    setExportRange,
    handleExport,
    rowCount,
  }
}
