/**
 * Custom hook for dashboard search/filter/sort logic
 * Extracts filter management from BusinessOwnerDashboard
 */

import { useCallback, useEffect } from 'react'

export function useDashboardFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  _currentPage,
  setCurrentPage,
  _setPageSize,
  fetchBusinessesPaginated
}) {
  // Search handler with debounced fetch
  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [setSearchTerm, setCurrentPage])

  // Status filter handler
  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }, [setStatusFilter, setCurrentPage])

  // Sort handler
  const handleSort = useCallback((field, order) => {
    setSortBy(field)
    setSortOrder(order)
    setCurrentPage(1)
  }, [setSortBy, setSortOrder, setCurrentPage])

  // Page change handler
  const handlePageChange = useCallback((page, _size) => {
    setCurrentPage(page)
    // Note: pageSize change would need separate handler if supported
  }, [setCurrentPage])

  // Table change handler (for Ant Design Table)
  const handleTableChange = useCallback((pagination, filters, sorter) => {
    handlePageChange(pagination.current, pagination.pageSize)
    if (sorter.field) {
      handleSort(sorter.field, sorter.order === 'descend' ? 'desc' : 'asc')
    }
  }, [handlePageChange, handleSort])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchBusinessesPaginated()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, fetchBusinessesPaginated])

  // Status filter effect
  useEffect(() => {
    if (statusFilter !== undefined) {
      fetchBusinessesPaginated()
    }
  }, [statusFilter, fetchBusinessesPaginated])

  // Sort effect
  useEffect(() => {
    if (sortBy !== undefined && sortOrder !== undefined) {
      fetchBusinessesPaginated()
    }
  }, [sortBy, sortOrder, fetchBusinessesPaginated])

  return {
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    handleTableChange
  }
}
