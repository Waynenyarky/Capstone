import { useCallback, useEffect, useState } from 'react'
import { App, Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import { createFormGroup, getFormGroups, getFormGroupStats, getFormDefinitionsAuditLog } from '../../services'

export function useAdminFormDefinitionsPage({ onCreateSuccess } = {}) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)
  const [stats, setStats] = useState({ activated: 0, deactivated: 0, retired: 0 })
  const [auditLog, setAuditLog] = useState([])
  const PAGE_SIZE = 20
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 })
  const [filters, setFilters] = useState({ formType: '', industryScope: '', search: '', includeRetired: false })
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const [createForm] = Form.useForm()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const [res, statsRes, auditRes] = await Promise.all([
        getFormGroups({
          formType: filters.formType || undefined,
          industryScope: filters.industryScope || undefined,
          search: filters.search || undefined,
          includeRetired: filters.includeRetired,
          page: pagination.page,
          limit: PAGE_SIZE,
        }),
        getFormGroupStats().catch(() => ({ stats: { activated: 0, deactivated: 0, retired: 0 } })),
        getFormDefinitionsAuditLog({ limit: 10 }).catch(() => ({ entries: [] })),
      ])
      setGroups(res.groups || [])
      if (res.pagination) {
        setPagination((prev) => ({ ...prev, total: res.pagination.total }))
      }
      setStats(statsRes?.stats || { activated: 0, deactivated: 0, retired: 0 })
      setAuditLog(auditRes?.entries || [])
      setLastRefreshedAt(new Date())
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load form groups:', err)
      message.error('Failed to load form groups')
    } finally {
      setLoading(false)
    }
  }, [filters.formType, filters.industryScope, filters.search, filters.includeRetired, pagination.page, message])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })
    setPagination((prev) => {
      if (prev.page === 1) return prev
      return { ...prev, page: 1 }
    })
  }, [])

  const handleTableChange = useCallback((paginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      page: paginationConfig.current,
    }))
  }, [])

  const openCreateModal = useCallback(() => setCreateModalOpen(true), [])
  const closeCreateModal = useCallback(() => setCreateModalOpen(false), [])

  const handleCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields()
      const res = await createFormGroup({ formType: values.formType, industryScope: values.industryScope })
      message.success('Form group created')
      setCreateModalOpen(false)
      createForm.resetFields()
      loadGroups()
      if (res?.group?._id) {
        if (onCreateSuccess) {
          onCreateSuccess(res)
        } else {
          navigate(`/admin/form-definitions/group/${res.group._id}`)
        }
      }
    } catch (err) {
      if (err?.errorFields) return
      // eslint-disable-next-line no-console
      console.error('Failed to create form group:', err)
      message.error(err.message || 'Failed to create form group')
    }
  }, [createForm, loadGroups, message, navigate, onCreateSuccess])

  const goToGroup = useCallback((record) => {
    navigate(`/admin/form-definitions/group/${record._id}`)
  }, [navigate])

  return {
    // state
    groups,
    loading,
    lastRefreshedAt,
    stats,
    auditLog,
    pagination,
    filters,
    createModalOpen,
    createForm,

    // commands
    loadGroups,
    handleFilterChange,
    handleTableChange,
    openCreateModal,
    closeCreateModal,
    handleCreate,
    goToGroup,
  }
}

