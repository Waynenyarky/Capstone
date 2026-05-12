import { v4 as uuidv4 } from 'uuid'

export function createEmptyCard(order = 0) {
  return {
    cardId: uuidv4(),
    title: '',
    description: '',
    requirements: [],
    downloadableFile: { cid: '', fileName: '', size: 0 },
    order,
  }
}

export function reorderCards(cards, fromIndex, toIndex) {
  const result = [...cards]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result.map((card, idx) => ({ ...card, order: idx }))
}

export function validateCard(card) {
  const errors = []
  if (!card.title || !card.title.trim()) {
    errors.push('Title is required')
  }
  return errors
}

export function validateSection(cards) {
  const allErrors = []
  cards.forEach((card, idx) => {
    const cardErrors = validateCard(card)
    if (cardErrors.length > 0) {
      allErrors.push({ cardIndex: idx, cardId: card.cardId, errors: cardErrors })
    }
  })
  return allErrors
}

export function hasUnsavedChanges(draftCards, publishedCards, draftDesc, publishedDesc) {
  return (
    JSON.stringify(draftCards) !== JSON.stringify(publishedCards) ||
    draftDesc !== publishedDesc
  )
}

export function resolveIpfsUrl(cid) {
  if (!cid) return ''
  if (cid.startsWith('http')) return cid
  const gateway = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'
  return `${gateway}${cid}`
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
