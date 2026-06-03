import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Form } from 'antd'
import dayjs from 'dayjs'
import { get, post, put, del, fetchWithFallback } from '@/lib/http.js'
import { ANNOUNCEMENTS_PAGE_SIZE, ANNOUNCEMENT_FORM_DEFAULTS } from '../constants/announcements.constants.js'
import { filterAnnouncements, filterAuditLogs } from '../utils/announcements.utils.js'

export default function useAnnouncements() {
  const { message } = App.useApp()

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const [formValues, setFormValues] = useState({})
  const [unpublishModalVisible, setUnpublishModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [auditLogModalVisible, setAuditLogModalVisible] = useState(false)
  const [selectedAuditLog, setSelectedAuditLog] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [auditLogs, setAuditLogs] = useState([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditLogsPage, setAuditLogsPage] = useState(1)
  const [auditLogsTotal, setAuditLogsTotal] = useState(0)
  const [auditSearch, setAuditSearch] = useState('')
  const [activeAuditTab, setActiveAuditTab] = useState('details')

  const [previewAnnouncements, setPreviewAnnouncements] = useState([])
  const [previewMaintenance, setPreviewMaintenance] = useState({ active: false, scheduled: false })

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/admin/announcements')
      setAnnouncements(Array.isArray(res) ? res : (res?.data || []))
      setLastUpdated(new Date())
    } catch {
      message.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [message])

  const fetchAuditLogs = useCallback(async (page = 1, announcementId = null) => {
    try {
      setAuditLogsLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '20', resourceType: 'announcement' })
      if (announcementId) params.set('announcementId', announcementId)
      const res = await get(`/api/admin/monitoring/audit-logs?${params.toString()}`)
      setAuditLogs(res?.data?.logs || [])
      setAuditLogsTotal(res?.meta?.total || 0)
    } catch {
      message.error('Failed to load audit logs')
    } finally {
      setAuditLogsLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  useEffect(() => {
    if (!selected?._id) {
      setAuditLogs([])
      setAuditLogsTotal(0)
      setAuditLogsPage(1)
      setAuditSearch('')
      return
    }

    if (activeAuditTab !== 'audit-logs') {
      return
    }

    setAuditLogsPage(1)
    fetchAuditLogs(1, selected._id)
  }, [activeAuditTab, fetchAuditLogs, selected])

  useEffect(() => {
    if (!selected || !announcements.length) {
      return
    }

    const updated = announcements.find((announcement) => announcement._id === selected._id)
    if (!updated) {
      return
    }

    setSelected(updated)
    form.setFieldsValue({
      title: updated.title || '',
      body: updated.body || '',
      priority: updated.priority || 'normal',
      isActive: updated.isActive !== false,
      publishAt: updated.publishAt ? dayjs(updated.publishAt) : null,
      expiresAt: updated.expiresAt ? dayjs(updated.expiresAt) : null,
    })
  }, [announcements, form, selected])

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const [res, maintenance] = await Promise.all([
          get('/api/admin/announcements'),
          get('/api/maintenance/status', { skipAuth: true }).catch(() => ({ active: false, scheduled: false })),
        ])

        const published = Array.isArray(res) ? res.filter((announcement) => announcement.status === 'published' && announcement.isActive) : []
        setPreviewAnnouncements(published)
        setPreviewMaintenance({
          active: !!maintenance?.active,
          scheduled: !!maintenance?.scheduled,
          message: maintenance?.message || '',
          expectedResumeAt: maintenance?.expectedResumeAt || null,
          scheduledStartAt: maintenance?.scheduledStartAt || null,
        })
      } catch {
        setPreviewAnnouncements([])
        setPreviewMaintenance({ active: false, scheduled: false })
      }
    }

    fetchPreview()
  }, [announcements])

  const filteredAnnouncements = useMemo(
    () => filterAnnouncements(announcements, search, statusFilter, priorityFilter),
    [announcements, search, statusFilter, priorityFilter],
  )

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * ANNOUNCEMENTS_PAGE_SIZE
    return filteredAnnouncements.slice(start, start + ANNOUNCEMENTS_PAGE_SIZE)
  }, [currentPage, filteredAnnouncements])

  const filteredAuditLogs = useMemo(() => filterAuditLogs(auditLogs, auditSearch), [auditLogs, auditSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, priorityFilter])

  const clearFilters = () => {
    setStatusFilter(null)
    setPriorityFilter(null)
  }

  const handleCreateDraft = async () => {
    try {
      setSaving(true)
      const res = await post('/api/admin/announcements', { status: 'draft' })
      const newAnnouncement = res?._id ? res : res?.data
      await fetchAnnouncements()
      if (newAnnouncement) {
        setSelected(newAnnouncement)
        form.setFieldsValue({
          ...ANNOUNCEMENT_FORM_DEFAULTS,
          title: '',
          body: '',
          priority: 'normal',
          isActive: false,
          expiresAt: null,
        })
      }
      message.success('Draft created')
    } catch (error) {
      message.error(error?.message || 'Failed to create draft')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (publish = false) => {
    if (!selected) return

    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload = {
        title: values.title || '',
        body: values.body || '',
        priority: values.priority || 'normal',
        status: publish ? 'published' : selected.status,
        isActive: publish ? true : (selected.isActive !== false),
        publishAt: values.publishAt?.toISOString() || null,
        expiresAt: values.expiresAt?.toISOString() || null,
      }
      const updatedAnnouncement = await put(`/api/admin/announcements/${selected._id}`, payload)
      setAnnouncements((prev) => prev.map((announcement) => announcement._id === selected._id ? updatedAnnouncement : announcement))
      setSelected(updatedAnnouncement)
      message.success(publish ? 'Announcement published' : 'Draft saved')
      if (publish) {
        setSelected(null)
      }
    } catch (error) {
      if (error?.errorFields) return
      message.error(error?.message || 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleFillTestData = () => {
    if (!selected) return

    const testValues = {
      title: 'Test Announcement - ' + dayjs().format('MMM D, h:mm A'),
      body: 'This is a test announcement created for demonstration purposes. It showcases the announcement system functionality and allows testing of various features including publishing, editing, and deletion.',
      priority: 'normal',
      isActive: true,
      publishAt: dayjs().add(1, 'day'),
      expiresAt: dayjs().add(7, 'days'),
    }

    form.setFieldsValue(testValues)
    setFormValues(testValues)
    message.success('Test data filled')
  }

  const handleDelete = async () => {
    if (!selected) return

    try {
      await del(`/api/admin/announcements/${selected._id}`)
      message.success('Announcement deleted')
      setSelected(null)
      setDeleteModalVisible(false)
      fetchAnnouncements()
    } catch {
      message.error('Failed to delete announcement')
    }
  }

  const handleExportAuditLogs = async () => {
    try {
      const params = new URLSearchParams({ resourceType: 'announcement', format: 'csv' })
      if (selected?._id) params.set('announcementId', selected._id)
      const response = await fetchWithFallback(`/api/admin/monitoring/audit-logs/export?${params.toString()}`, { method: 'GET' })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to export audit logs')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `announcement-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      message.error(error?.message || 'Failed to export audit logs')
    }
  }

  const openAuditLog = (log) => {
    setSelectedAuditLog(log)
    setAuditLogModalVisible(true)
  }

  const handleUnpublish = async () => {
    if (!selected) return

    try {
      setSaving(true)
      await put(`/api/admin/announcements/${selected._id}`, {
        ...selected,
        status: 'draft',
        isActive: false,
      })
      message.success('Announcement unpublished')
      setUnpublishModalVisible(false)
      fetchAnnouncements()
    } catch (error) {
      message.error(error?.message || 'Failed to unpublish announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleSelect = (record) => {
    setSelected(record)
    const values = {
      title: record.title || '',
      body: record.body || '',
      priority: record.priority || 'normal',
      isActive: record.isActive !== false,
      publishAt: record.publishAt ? dayjs(record.publishAt) : null,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    }

    form.setFieldsValue(values)
    setFormValues(values)
  }

  const handleKeyDown = (event, record) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect(record)
    }
  }

  return {
    announcements,
    loading,
    selected,
    setSelected,
    saving,
    form,
    formValues,
    setFormValues,
    unpublishModalVisible,
    setUnpublishModalVisible,
    deleteModalVisible,
    setDeleteModalVisible,
    infoOpen,
    setInfoOpen,
    auditLogModalVisible,
    setAuditLogModalVisible,
    selectedAuditLog,
    setSelectedAuditLog,
    lastUpdated,
    search,
    setSearch,
    filterOpen,
    setFilterOpen,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    currentPage,
    setCurrentPage,
    auditLogs,
    auditLogsLoading,
    auditLogsPage,
    setAuditLogsPage,
    auditLogsTotal,
    auditSearch,
    setAuditSearch,
    activeAuditTab,
    setActiveAuditTab,
    previewAnnouncements,
    previewMaintenance,
    filteredAnnouncements,
    paginatedAnnouncements,
    filteredAuditLogs,
    clearFilters,
    handleCreateDraft,
    handleSave,
    handleFillTestData,
    handleDelete,
    handleExportAuditLogs,
    openAuditLog,
    handleUnpublish,
    handleSelect,
    handleKeyDown,
    fetchAnnouncements,
  }
}
