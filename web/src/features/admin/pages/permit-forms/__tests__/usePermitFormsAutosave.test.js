import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePermitFormsAutosave from '../hooks/usePermitFormsAutosave.js'

describe('usePermitFormsAutosave', () => {
  it('renders without crashing when enabled', () => {
    const save = vi.fn()
    const cards = [{ cardId: 'c1', title: 'Test' }]
    const description = 'Desc'

    renderHook(() => usePermitFormsAutosave(cards, description, save, true))
    expect(save).not.toHaveBeenCalled()
  })

  it('does not call save when disabled', () => {
    const save = vi.fn()
    renderHook(() => usePermitFormsAutosave([], '', save, false))
    expect(save).not.toHaveBeenCalled()
  })

  it('handles re-renders when enabled', () => {
    const save = vi.fn()
    const { rerender } = renderHook(
      ({ cards, desc }) => usePermitFormsAutosave(cards, desc, save, true),
      { initialProps: { cards: [{ cardId: 'c1', title: 'A' }], desc: 'A' } }
    )

    rerender({ cards: [{ cardId: 'c1', title: 'B' }], desc: 'B' })
    rerender({ cards: [{ cardId: 'c1', title: 'C' }], desc: 'C' })

    // Should not have called save synchronously (debounce)
    expect(save).not.toHaveBeenCalled()
  })
})
