import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePermitFormsAudit from '../hooks/usePermitFormsAudit.js'

vi.mock('@/features/admin/services/permitFormsService', () => ({
  getPermitFormsAudit: vi.fn().mockResolvedValue({
    logs: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  }),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return { ...actual, message: { success: vi.fn(), error: vi.fn() } }
})

describe('usePermitFormsAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hook without crashing', () => {
    const { result } = renderHook(() => usePermitFormsAudit())
    expect(result.current).toBeDefined()
  })

  it('has pageSize constant', () => {
    const { result } = renderHook(() => usePermitFormsAudit())
    expect(result.current.pageSize).toBe(20)
  })
})
