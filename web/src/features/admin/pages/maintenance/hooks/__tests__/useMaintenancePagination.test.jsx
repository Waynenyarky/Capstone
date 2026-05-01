import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMaintenancePagination } from '../useMaintenancePagination.js'

describe('useMaintenancePagination', () => {
  it('initializes with page 1', () => {
    const { result } = renderHook(() => useMaintenancePagination([]))

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
  })

  it('uses custom pageSize', () => {
    const { result } = renderHook(() => useMaintenancePagination([], 10))

    expect(result.current.pageSize).toBe(10)
  })

  it('calculates total items', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ id: i }))
    const { result } = renderHook(() => useMaintenancePagination(data))

    expect(result.current.total).toBe(50)
  })

  it('returns correct paginated data for page 1', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ id: i }))
    const { result } = renderHook(() => useMaintenancePagination(data, 10))

    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.paginatedData[0].id).toBe(0)
    expect(result.current.paginatedData[9].id).toBe(9)
  })

  it('provides setPage function', () => {
    const { result } = renderHook(() => useMaintenancePagination([]))

    expect(typeof result.current.setPage).toBe('function')
  })

  it('handles empty data', () => {
    const { result } = renderHook(() => useMaintenancePagination([]))

    expect(result.current.total).toBe(0)
    expect(result.current.paginatedData).toHaveLength(0)
  })

  it('handles data less than page size', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: i }))
    const { result } = renderHook(() => useMaintenancePagination(data, 10))

    expect(result.current.paginatedData).toHaveLength(5)
    expect(result.current.total).toBe(5)
  })
})
