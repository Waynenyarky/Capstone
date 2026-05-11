import { describe, it, expect } from 'vitest'
import {
  createEmptyCard,
  reorderCards,
  validateCard,
  validateSection,
  hasUnsavedChanges,
  resolveIpfsUrl,
  formatFileSize,
} from '../utils/permitForms.utils.js'

describe('createEmptyCard', () => {
  it('creates a card with default values', () => {
    const card = createEmptyCard(0)
    expect(card.cardId).toBeDefined()
    expect(card.title).toBe('')
    expect(card.description).toBe('')
    expect(card.requirements).toEqual([])
    expect(card.downloadableFile).toEqual({ cid: '', fileName: '', size: 0 })
    expect(card.order).toBe(0)
  })

  it('uses provided order', () => {
    const card = createEmptyCard(5)
    expect(card.order).toBe(5)
  })

  it('creates unique cardIds', () => {
    const card1 = createEmptyCard(0)
    const card2 = createEmptyCard(1)
    expect(card1.cardId).not.toBe(card2.cardId)
  })
})

describe('reorderCards', () => {
  const cards = [
    { cardId: 'a', title: 'A', order: 0 },
    { cardId: 'b', title: 'B', order: 1 },
    { cardId: 'c', title: 'C', order: 2 },
  ]

  it('moves card from index 0 to index 2', () => {
    const result = reorderCards(cards, 0, 2)
    expect(result[0].cardId).toBe('b')
    expect(result[1].cardId).toBe('c')
    expect(result[2].cardId).toBe('a')
  })

  it('moves card from index 2 to index 0', () => {
    const result = reorderCards(cards, 2, 0)
    expect(result[0].cardId).toBe('c')
    expect(result[1].cardId).toBe('a')
    expect(result[2].cardId).toBe('b')
  })

  it('updates order numbers after reorder', () => {
    const result = reorderCards(cards, 0, 2)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
    expect(result[2].order).toBe(2)
  })

  it('does not mutate original array', () => {
    const original = [...cards]
    reorderCards(cards, 0, 2)
    expect(cards).toEqual(original)
  })
})

describe('validateCard', () => {
  it('returns empty errors for valid card', () => {
    const card = { title: 'Test' }
    expect(validateCard(card)).toEqual([])
  })

  it('returns error for missing title', () => {
    const card = { title: '' }
    const errors = validateCard(card)
    expect(errors).toContain('Title is required')
  })

  it('returns error for whitespace-only title', () => {
    const card = { title: '   ' }
    const errors = validateCard(card)
    expect(errors).toContain('Title is required')
  })
})

describe('validateSection', () => {
  it('returns empty errors for valid cards', () => {
    const cards = [
      { cardId: 'c1', title: 'Card 1' },
      { cardId: 'c2', title: 'Card 2' },
    ]
    expect(validateSection(cards)).toEqual([])
  })

  it('returns errors for invalid cards', () => {
    const cards = [
      { cardId: 'c1', title: '' },
      { cardId: 'c2', title: 'Valid' },
    ]
    const errors = validateSection(cards)
    expect(errors).toHaveLength(1)
    expect(errors[0].cardIndex).toBe(0)
    expect(errors[0].cardId).toBe('c1')
  })
})

describe('hasUnsavedChanges', () => {
  it('returns false when identical', () => {
    const cards = [{ cardId: 'c1', title: 'A' }]
    expect(hasUnsavedChanges(cards, cards, 'desc', 'desc')).toBe(false)
  })

  it('returns true when cards differ', () => {
    const draft = [{ cardId: 'c1', title: 'A' }]
    const published = [{ cardId: 'c1', title: 'B' }]
    expect(hasUnsavedChanges(draft, published, 'desc', 'desc')).toBe(true)
  })

  it('returns true when description differs', () => {
    const cards = [{ cardId: 'c1', title: 'A' }]
    expect(hasUnsavedChanges(cards, cards, 'draft', 'published')).toBe(true)
  })
})

describe('resolveIpfsUrl', () => {
  it('returns empty string for falsy cid', () => {
    expect(resolveIpfsUrl('')).toBe('')
    expect(resolveIpfsUrl(null)).toBe('')
    expect(resolveIpfsUrl(undefined)).toBe('')
  })

  it('returns http URL as-is', () => {
    expect(resolveIpfsUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf')
  })

  it('prepends gateway URL for IPFS CID', () => {
    const result = resolveIpfsUrl('QmTest123')
    expect(result).toContain('QmTest123')
    expect(result).toMatch(/^https?:\/\//)
  })
})

describe('formatFileSize', () => {
  it('returns 0 B for zero', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
  })

  it('handles null', () => {
    expect(formatFileSize(null)).toBe('0 B')
  })
})
