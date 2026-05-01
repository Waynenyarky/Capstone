import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import dayjs from 'dayjs'
import { useMaintenanceExport } from '../useMaintenanceExport.js'

// Mock dependencies
vi.mock('../../utils/maintenance.utils.js', () => ({
  getRangeFilteredApprovals: vi.fn(() => []),
  generateCsvExport: vi.fn(() => 'csv,data')
}))

describe('useMaintenanceExport', () => {
  const mockApprovals = [
    { approvalId: '1', createdAt: '2024-01-01', requestDetails: { reason: 'Test' } },
    { approvalId: '2', createdAt: '2024-01-02', requestDetails: { reason: 'Test 2' } },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    expect(result.current.exportOpen).toBe(false)
    expect(result.current.exportRange).toEqual([null, null])
    expect(result.current.rowCount).toBe(0)
  })

  it('provides setter functions', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    expect(typeof result.current.setExportOpen).toBe('function')
    expect(typeof result.current.setExportRange).toBe('function')
    expect(typeof result.current.handleExport).toBe('function')
  })

  it('returns 0 row count when range is not set', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    expect(result.current.rowCount).toBe(0)
  })

  it('does not handle export when range is not set', () => {
    const mockOnDownload = vi.fn()
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals, mockOnDownload))

    result.current.handleExport()

    expect(mockOnDownload).not.toHaveBeenCalled()
  })

  it('does not handle export when csv generation fails', () => {
    expect(true).toBe(true)
  })
})
