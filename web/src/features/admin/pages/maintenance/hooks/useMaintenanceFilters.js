import { useState } from 'react'

export function useMaintenanceFilters() {
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState(null)
  const [historyReasonFilter, setHistoryReasonFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [showAllRequests, setShowAllRequests] = useState(false)

  const clearFilters = () => {
    setHistorySearch('')
    setHistoryStatusFilter(null)
    setHistoryReasonFilter(null)
  }

  return {
    historySearch,
    setHistorySearch,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyReasonFilter,
    setHistoryReasonFilter,
    filterOpen,
    setFilterOpen,
    showAllRequests,
    setShowAllRequests,
    clearFilters,
  }
}
