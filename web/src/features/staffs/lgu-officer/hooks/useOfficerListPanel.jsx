import { useState, useEffect, useRef, useCallback } from 'react'

export default function useOfficerListPanel({ activeTab }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterWrapperRef = useRef(null)

  // Reset search and filter when tab changes
  useEffect(() => {
    setSearch('')
    setStatusFilter(null)
    setFilterOpen(false)
  }, [activeTab])

  // Close filter panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearch(value)
  }, [])

  const handleFilterChange = useCallback((value) => {
    setStatusFilter(value)
  }, [])

  const handleFilterToggle = useCallback(() => {
    setFilterOpen(prev => !prev)
  }, [])

  const handleFilterClear = useCallback(() => {
    setStatusFilter(null)
  }, [])

  return {
    search,
    statusFilter,
    filterOpen,
    filterWrapperRef,
    handleSearchChange,
    handleFilterChange,
    handleFilterToggle,
    handleFilterClear,
  }
}
