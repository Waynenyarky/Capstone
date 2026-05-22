import { useState } from 'react'

export function useCmsAuditFilters() {
  const [searchValue, setSearchValue] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState(null)
  const [dateRangeFilter, setDateRangeFilter] = useState(null)

  const clearFilters = () => {
    setSearchValue('')
    setEventTypeFilter(null)
    setDateRangeFilter(null)
  }

  const activeFilterCount = [eventTypeFilter, dateRangeFilter].filter(Boolean).length

  return {
    searchValue,
    setSearchValue,
    eventTypeFilter,
    setEventTypeFilter,
    dateRangeFilter,
    setDateRangeFilter,
    clearFilters,
    activeFilterCount,
  }
}
