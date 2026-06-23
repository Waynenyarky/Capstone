import { useState } from 'react'

export function useFeesFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const clearFilters = () => {
    setStatusFilter('')
  }

  const activeFilterCount = statusFilter ? 1 : 0

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filterOpen,
    setFilterOpen,
    clearFilters,
    activeFilterCount,
  }
}
