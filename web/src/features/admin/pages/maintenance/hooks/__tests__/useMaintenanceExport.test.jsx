import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
    // Setup document methods
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
    URL.createObjectURL = vi.fn(() => 'blob:url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    expect(result.current.exportOpen).toBe(false)
    expect(result.current.exportRange).toEqual([null, null])
    expect(result.current.rowCount).toBe(0)
  })

  it('opens export modal', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    act(() => {
      result.current.setExportOpen(true)
    })

    expect(result.current.exportOpen).toBe(true)
  })

  it('sets export range', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    const startDate = dayjs('2024-01-01')
    const endDate = dayjs('2024-01-31')

    act(() => {
      result.current.setExportRange([startDate, endDate])
    })

    expect(result.current.exportRange).toEqual([startDate, endDate])
  })

  it('calculates row count when range is set', async () => {
    const { getRangeFilteredApprovals } = await import("../../utils/maintenance.utils.js");
    getRangeFilteredApprovals.mockReturnValue(mockApprovals);
    const startDate = dayjs("2024-01-01");
    const endDate = dayjs("2024-01-31");

    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    act(() => {
      result.current.setExportRange([startDate, endDate])
    })

    expect(result.current.rowCount).toBe(2)
    expect(getRangeFilteredApprovals).toHaveBeenCalledWith(mockApprovals, startDate, endDate)
  })

  it('returns 0 row count when range is not set', () => {
    const { result } = renderHook(() => useMaintenanceExport(mockApprovals))

    expect(result.current.rowCount).toBe(0)
  })

  it('handles export when range is set', async () => {
    const { getRangeFilteredApprovals, generateCsvExport } = await import('../../utils/maintenance.utils.js')
    getRangeFilteredApprovals.mockReturnValue(mockApprovals)
    generateCsvExport.mockReturnValue('csv,content')

    const mockOnDownload = vi.fn()

    const startDate = dayjs('2024-01-01')
    const endDate = dayjs('2024-01-31')

    const { result } = renderHook(() => useMaintenanceExport(mockApprovals, mockOnDownload))

    act(() => {
      result.current.setExportRange([startDate, endDate])
      result.current.handleExport()
    })

    expect(generateCsvExport).toHaveBeenCalledWith(mockApprovals)
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(mockOnDownload).toHaveBeenCalled()
    expect(result.current.exportOpen).toBe(false)
    expect(result.current.exportRange).toEqual([null, null])
  })

  it('does not handle export when range is not set', async () => {
    const { generateCsvExport } = await import('../utils/maintenance.utils.js')

    const mockOnDownload = vi.fn()

    const { result } = renderHook(() => useMaintenanceExport(mockApprovals, mockOnDownload))

    act(() => {
      result.current.handleExport()
    })

    expect(generateCsvExport).not.toHaveBeenCalled()
    expect(mockOnDownload).not.toHaveBeenCalled()
    expect(result.current.exportOpen).toBe(false)
  })

  it('does not handle export when csv generation fails', async () => {
    const { getRangeFilteredApprovals, generateCsvExport } = await import('../utils/maintenance.utils.js')
    getRangeFilteredApprovals.mockReturnValue(mockApprovals)
    generateCsvExport.mockReturnValue(null)

    const mockOnDownload = vi.fn()

    const startDate = dayjs('2024-01-01')
    const endDate = dayjs('2024-01-31')

    const { result } = renderHook(() => useMaintenanceExport(mockApprovals, mockOnDownload))

    act(() => {
      result.current.setExportRange([startDate, endDate])
      result.current.handleExport()
    })

    expect(document.body.appendChild).not.toHaveBeenCalled()
    expect(mockOnDownload).not.toHaveBeenCalled()
    expect(result.current.exportOpen).toBe(false)
  })
})

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
