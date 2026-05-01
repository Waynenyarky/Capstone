import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMaintenanceFilters } from '../useMaintenanceFilters.js'

describe('useMaintenanceFilters', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useMaintenanceFilters())

    expect(result.current.historySearch).toBe('')
    expect(result.current.historyStatusFilter).toBe(null)
    expect(result.current.historyReasonFilter).toBe(null)
    expect(result.current.filterOpen).toBe(false)
    expect(result.current.showAllRequests).toBe(false)
  })

  it('provides setter functions', () => {
    const { result } = renderHook(() => useMaintenanceFilters())

    expect(typeof result.current.setHistorySearch).toBe('function')
    expect(typeof result.current.setHistoryStatusFilter).toBe('function')
    expect(typeof result.current.setHistoryReasonFilter).toBe('function')
    expect(typeof result.current.setFilterOpen).toBe('function')
    expect(typeof result.current.setShowAllRequests).toBe('function')
    expect(typeof result.current.clearFilters).toBe('function')
  })

  it('clearFilters is a function that can be called', () => {
    const { result } = renderHook(() => useMaintenanceFilters())

    expect(() => result.current.clearFilters()).not.toThrow()
  })
})
