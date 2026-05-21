import { useState, useEffect, useCallback, useRef } from 'react'
import { App } from 'antd'
import {
  getPermitForms,
  saveDraft,
  publishPermitForms,
  revertPermitForms,
  togglePermitForms,
} from '@/features/admin/services/permitFormsService'
import { createEmptyCard } from '../utils'

export default function usePermitForms() {
  const { message } = App.useApp()
  const [section, setSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Draft state
  const [draftCards, setDraftCards] = useState([])
  const [draftDescription, setDraftDescription] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)

  // Published snapshot for undo
  const [publishedCards, setPublishedCards] = useState([])
  const [publishedDescription, setPublishedDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  // Undo history for per-field undo
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)

  const pushHistory = useCallback((cards, desc) => {
    if (!historyRef.current) {
      historyRef.current = []
    }
    const next = historyIndexRef.current + 1
    historyRef.current = historyRef.current.slice(0, next)
    historyRef.current.push({ cards: JSON.parse(JSON.stringify(cards)), description: desc })
    historyIndexRef.current = next
  }, [])

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPermitForms()
      setSection(data)
      const cards = data?.cards || []
      const desc = data?.sectionDescription || ''
      setDraftCards(cards)
      setDraftDescription(desc)
      setIsEnabled(data?.isEnabled !== false)
      setPublishedCards(data?.publishedCards || [])
      setPublishedDescription(data?.publishedSectionDescription || '')
      setIsPublished(data?.isPublished || false)
      historyRef.current = [{ cards: JSON.parse(JSON.stringify(cards)), description: desc }]
      historyIndexRef.current = 0
    } catch (err) {
      console.error('Failed to fetch permit forms:', err)
      message.error('Failed to load permit forms')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => { fetch() }, [fetch])

  const save = useCallback(async (cards, description) => {
    try {
      setSaving(true)
      await saveDraft({ cards, sectionDescription: description })
    } catch (err) {
      console.error('Failed to save draft:', err)
    } finally {
      setSaving(false)
    }
  }, [])

  const publish = useCallback(async () => {
    try {
      setPublishing(true)
      const data = await publishPermitForms()
      setSection(data)
      setPublishedCards(data?.publishedCards || [])
      setPublishedDescription(data?.publishedSectionDescription || '')
      setIsPublished(true)
      message.success('Permit forms published successfully')
    } catch (err) {
      console.error('Failed to publish:', err)
      message.error('Failed to publish permit forms')
    } finally {
      setPublishing(false)
    }
  }, [message])

  const revert = useCallback(async () => {
    try {
      setSaving(true)
      const data = await revertPermitForms()
      setSection(data)
      const cards = data?.cards || []
      const desc = data?.sectionDescription || ''
      setDraftCards(cards)
      setDraftDescription(desc)
      // Reset history to the reverted state
      historyRef.current = [{ cards: JSON.parse(JSON.stringify(cards)), description: desc }]
      historyIndexRef.current = 0
      message.success('Reverted to last published version')
    } catch (err) {
      console.error('Failed to revert:', err)
      if (err?.response?.data?.error === 'no_published') {
        message.warning('No published version to revert to. Publish the current draft first.')
      } else {
        message.error('Failed to revert permit forms')
      }
    } finally {
      setSaving(false)
    }
  }, [message])

  const toggle = useCallback(async (enabled) => {
    try {
      const data = await togglePermitForms(enabled)
      setIsEnabled(data?.isEnabled !== false)
      message.success(enabled ? 'Permit forms section enabled' : 'Permit forms section disabled')
    } catch (err) {
      console.error('Failed to toggle:', err)
      message.error('Failed to toggle permit forms')
    }
  }, [message])

  const updateCards = useCallback((newCards) => {
    setDraftCards(newCards)
    pushHistory(newCards, draftDescription)
  }, [draftDescription, pushHistory])

  const updateDescription = useCallback((desc) => {
    setDraftDescription(desc)
    pushHistory(draftCards, desc)
  }, [draftCards, pushHistory])

  const addCard = useCallback(() => {
    const newCard = createEmptyCard(draftCards.length)
    const newCards = [...draftCards, newCard]
    updateCards(newCards)
    message.success('Card added successfully')
  }, [draftCards, updateCards, message])

  const deleteCard = useCallback((cardId) => {
    const newCards = draftCards
      .filter((c) => c.cardId !== cardId)
      .map((c, idx) => ({ ...c, order: idx }))
    updateCards(newCards)
    message.success('Card removed successfully')
  }, [draftCards, updateCards, message])

  const updateCard = useCallback((cardId, updates) => {
    const newCards = draftCards.map((c) =>
      c.cardId === cardId ? { ...c, ...updates, lastUpdatedAt: new Date().toISOString() } : c
    )
    updateCards(newCards)
  }, [draftCards, updateCards])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const entry = historyRef.current[historyIndexRef.current]
    setDraftCards(JSON.parse(JSON.stringify(entry.cards)))
    setDraftDescription(entry.description)
    message.success('Undo successful')
  }, [message])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const entry = historyRef.current[historyIndexRef.current]
    setDraftCards(JSON.parse(JSON.stringify(entry.cards)))
    setDraftDescription(entry.description)
    message.success('Redo successful')
  }, [message])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyRef.current && historyIndexRef.current < historyRef.current.length - 1

  return {
    section,
    loading,
    saving,
    publishing,
    draftCards,
    draftDescription,
    isEnabled,
    publishedCards,
    publishedDescription,
    isPublished,
    canUndo,
    canRedo,
    fetch,
    save,
    publish,
    revert,
    toggle,
    updateCards,
    updateDescription,
    addCard,
    deleteCard,
    updateCard,
    undo,
    redo,
  }
}
