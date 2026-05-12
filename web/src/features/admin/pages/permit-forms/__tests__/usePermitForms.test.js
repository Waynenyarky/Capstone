import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePermitForms from '../hooks/usePermitForms.js'

// Mock the service to return empty state
vi.mock('@/features/admin/services/permitFormsService', () => ({
  getPermitForms: vi.fn().mockResolvedValue({
    _id: 'section-1',
    sectionDescription: '',
    cards: [],
    publishedSectionDescription: '',
    publishedCards: [],
    isPublished: false,
    isEnabled: false,
  }),
  saveDraft: vi.fn().mockResolvedValue({}),
  publishPermitForms: vi.fn().mockResolvedValue({}),
  revertPermitForms: vi.fn().mockResolvedValue({}),
  togglePermitForms: vi.fn().mockResolvedValue({}),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  }
})

describe('usePermitForms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hook without crashing', () => {
    const { result } = renderHook(() => usePermitForms())
    expect(result.current).toBeDefined()
    expect(result.current.draftCards).toEqual([])
    expect(result.current.draftDescription).toBe('')
  })
})
