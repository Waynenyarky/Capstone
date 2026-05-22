import { useState, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { get, post, put, del } from '@/lib/http.js'

export default function useAnnouncementsTab(audience) {
  const { message } = App.useApp()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const query = audience ? `?audience=${audience}` : ''
      const res = await get(`/api/admin/announcements${query}`)
      setAnnouncements(Array.isArray(res) ? res : (res?.data || []))
    } catch {
      message.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [message, audience])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const handleCreateDraft = useCallback(async () => {
    try {
      setSaving(true)
      const payload = { status: 'draft', audience }
      const res = await post('/api/admin/announcements', payload)
      const newAnnouncement = res?._id ? res : res?.data
      await fetchAnnouncements()
      if (newAnnouncement) {
        setSelected(newAnnouncement)
      }
      message.success('Draft created')
    } catch (err) {
      message.error(err?.message || 'Failed to create draft')
    } finally {
      setSaving(false)
    }
  }, [message, audience, fetchAnnouncements])

  const handleSave = useCallback(async (id, values, publish = false) => {
    try {
      setSaving(true)
      const payload = {
        ...values,
        status: publish ? 'published' : values.status,
        audience: audience || values.audience || 'public',
      }
      const updatedAnnouncement = await put(`/api/admin/announcements/${id}`, payload)
      setAnnouncements(prev => prev.map(a => a._id === id ? updatedAnnouncement : a))
      setSelected(updatedAnnouncement)
      message.success(publish ? 'Announcement published' : 'Draft saved')
      if (publish) {
        setSelected(null)
      }
    } catch (err) {
      message.error(err?.message || 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }, [message, audience])

  const handleDelete = useCallback(async (id) => {
    try {
      await del(`/api/admin/announcements/${id}`)
      message.success('Announcement deleted')
      setSelected(null)
      fetchAnnouncements()
    } catch {
      message.error('Failed to delete announcement')
    }
  }, [message, fetchAnnouncements])

  return {
    announcements,
    loading,
    selected,
    setSelected,
    saving,
    handleCreateDraft,
    handleSave,
    handleDelete,
    refresh: fetchAnnouncements,
  }
}
