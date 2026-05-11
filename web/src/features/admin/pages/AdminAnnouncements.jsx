import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { App, Button, Input, Select, Tag, Tooltip, Splitter, Grid, Pagination, theme, Empty, Typography, Form, DatePicker, Spin, Modal, Tabs, Table } from 'antd'
import { PlusOutlined, FilterOutlined, SearchOutlined, CloseOutlined, NotificationOutlined, DeleteOutlined, SaveOutlined, SendOutlined, FileTextOutlined, ArrowLeftOutlined, RollbackOutlined, HistoryOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import AdminLayout from '../components/AdminLayout'
import HomeHeader from '@/features/public/components/HomeHeader'
import HomeFooter from '@/features/public/components/HomeFooter'
import { Layout, Collapse } from 'antd'
import { BRAND_COLORS } from '@/shared/theme/ThemeProvider'
import { get, post, put, del, fetchWithFallback } from '@/lib/http.js'
import dayjs from 'dayjs'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

export default function AdminAnnouncements({ embedded = false }) {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

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

  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const filterWrapperRef = useRef(null)

  const [auditLogs, setAuditLogs] = useState([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditLogsPage, setAuditLogsPage] = useState(1)
  const [auditLogsTotal, setAuditLogsTotal] = useState(0)

  const PAGE_SIZE = 20

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const res = await get('/api/admin/announcements')
      setAnnouncements(Array.isArray(res) ? res : (res?.data || []))
    } catch {
      message.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [message])

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setAuditLogsLoading(true)
      const res = await get(`/api/admin/monitoring/audit-logs?page=${page}&limit=20&resourceType=announcement`)
      const logs = res?.data?.logs || []
      setAuditLogs(logs)
      setAuditLogsTotal(res?.meta?.total || 0)
    } catch (err) {
      message.error('Failed to load audit logs')
    } finally {
      setAuditLogsLoading(false)
    }
  }, [message])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  useEffect(() => {
    if (selected && announcements?.length) {
      const updated = announcements.find((a) => a._id === selected._id)
      if (updated) {
        setSelected(updated)
        form.setFieldsValue({
          title: updated.title || '',
          body: updated.body || '',
          priority: updated.priority || 'normal',
          isActive: updated.isActive !== false,
          publishAt: updated.publishAt ? dayjs(updated.publishAt) : null,
          expiresAt: updated.expiresAt ? dayjs(updated.expiresAt) : null,
        })
      }
    }
  }, [announcements])

  useEffect(() => {
    if (!filterOpen) return
    const handleClickOutside = (e) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(e.target)) {
        const isSelectDropdown = e.target.closest('.ant-select-dropdown')
        if (!isSelectDropdown) setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length

  const filteredAnnouncements = useMemo(() => {
    let list = announcements || []
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((rec) => {
        const title = (rec?.title || '').toLowerCase()
        const body = (rec?.body || '').toLowerCase()
        return title.includes(q) || body.includes(q)
      })
    }
    if (statusFilter) {
      list = list.filter((rec) => rec?.status === statusFilter)
    }
    if (priorityFilter) {
      list = list.filter((rec) => rec?.priority === priorityFilter)
    }
    return list
  }, [announcements, search, statusFilter, priorityFilter])

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return (filteredAnnouncements || []).slice(start, start + PAGE_SIZE)
  }, [filteredAnnouncements, currentPage])

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
          title: '',
          body: '',
          priority: 'normal',
          isActive: false,
          expiresAt: null,
        })
      }
      message.success('Draft created')
    } catch (err) {
      message.error(err?.message || 'Failed to create draft')
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
      setAnnouncements(prev => prev.map(a => a._id === selected._id ? updatedAnnouncement : a))
      setSelected(updatedAnnouncement)
      message.success(publish ? 'Announcement published' : 'Draft saved')
      if (publish) {
        setSelected(null)
      }
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.message || 'Failed to save announcement')
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
      expiresAt: dayjs().add(7, 'days')
    }
    form.setFieldsValue(testValues)
    setFormValues(testValues)
    message.success('Test data filled')
  }

  const [previewAnnouncements, setPreviewAnnouncements] = useState([])
  const [previewMaintenance, setPreviewMaintenance] = useState({ active: false, scheduled: false })

  useEffect(() => {
    const fetchPreviewAnnouncements = async () => {
      try {
        const [res, maintenance] = await Promise.all([
          get('/api/admin/announcements'),
          get('/api/maintenance/status', { skipAuth: true }).catch(() => ({ active: false, scheduled: false })),
        ])
        const published = Array.isArray(res) ? res.filter(a => a.status === 'published' && a.isActive) : []
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
    fetchPreviewAnnouncements()
  }, [announcements])

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
      const response = await fetchWithFallback('/api/admin/monitoring/audit-logs/export?resourceType=announcement&format=csv', { method: 'GET' })
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
    } catch (err) {
      message.error(err?.message || 'Failed to export audit logs')
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
    } catch (err) {
      message.error(err?.message || 'Failed to unpublish announcement')
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

  const priorityColors = { high: 'red', urgent: 'magenta', normal: 'blue', low: 'default' }
  const statusColors = { draft: 'orange', published: 'green' }

  const listContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search announcements"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ position: 'relative' }} ref={filterWrapperRef}>
            <Tooltip title="Filter">
              <Button
                icon={<FilterOutlined />}
                type={activeFilterCount > 0 ? 'primary' : 'default'}
                ghost={activeFilterCount > 0}
                onClick={() => setFilterOpen((prev) => !prev)}
                aria-label="Toggle filters"
              />
            </Tooltip>

            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: '16px 20px',
                  background: '#fff',
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  zIndex: 1000,
                  minWidth: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13 }}>Filters</Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                  <Select
                    placeholder="All statuses"
                    allowClear
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                    ]}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Priority</Text>
                  <Select
                    placeholder="All priorities"
                    allowClear
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'urgent', label: 'Urgent' },
                      { value: 'high', label: 'High' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button size="small" type="link" onClick={clearFilters} style={{ alignSelf: 'flex-start', padding: 0 }}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Tooltip title="About announcements">
            <Button icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} aria-label="Announcement info" />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDraft} loading={saving}>
            Add
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: 'flex', flexDirection: 'column', ['--row-selected-bg']: token.colorPrimaryBg }}>
        <div style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTop: `1px solid ${token.colorBorderSecondary}`, overflow: 'auto', flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Spin />
            </div>
          ) : paginatedAnnouncements.length === 0 ? (
            <Empty description="No announcements" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {paginatedAnnouncements.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: selected?._id === item._id ? token.colorPrimaryBg : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Text strong ellipsis style={{ flex: 1 }}>{item.title || '(Untitled)'}</Text>
                    <Tag color={statusColors[item.status] || 'default'} style={{ margin: 0 }}>
                      {(item.status || 'draft').toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tag color={priorityColors[item.priority] || 'default'} style={{ margin: 0 }}>
                      {(item.priority || 'normal').toUpperCase()}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.createdAt ? dayjs(item.createdAt).format('MMM D, YYYY') : '-'}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={currentPage}
            total={filteredAnnouncements?.length || 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            onChange={setCurrentPage}
            size="small"
          />
        </div>
      </div>
    </div>
  )

  const detailContent = selected ? (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgContainer }}>
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color={statusColors[selected.status] || 'default'}>
              {(selected.status || 'draft').toUpperCase()}
            </Tag>
            <Tag color="blue">
              Created {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
            </Tag>
            {selected.updatedAt && selected.updatedAt !== selected.createdAt && (
              <Tag color="green">
                Updated {dayjs(selected.updatedAt).format('MMM D, h:mm A')}
              </Tag>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {selected.status === 'draft' && (
            <>
              <Button icon={<FileTextOutlined />} onClick={handleFillTestData}>
                Fill with test data
              </Button>
              <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>
                Save Draft
              </Button>
              <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave(true)} loading={saving}>
                Publish
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModalVisible(true)}>
                Delete
              </Button>
            </>
          )}
          {selected.status === 'published' && (
            <Button icon={<RollbackOutlined />} onClick={() => setUnpublishModalVisible(true)} loading={saving}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
        }}
      >
        <Tabs
          tabBarGutter={16}
          defaultActiveKey="details"
          onChange={(key) => {
            if (key === 'audit-logs' && auditLogs.length === 0) {
              fetchAuditLogs()
            }
          }}
          items={[
            {
              key: 'details',
              label: 'Details',
              children: (
                <div style={{ padding: 16 }}>
                  <Form form={form} layout="vertical" onValuesChange={(_, allValues) => setFormValues(allValues)}>
                    <Form.Item
                      name="title"
                      label="Title"
                      rules={[{ required: true, message: 'Title is required' }]}
                    >
                      <Input placeholder="Announcement title" disabled={selected.status === 'published'} />
                    </Form.Item>
                    <Form.Item
                      name="body"
                      label="Content"
                      rules={[{ required: true, message: 'Content is required' }]}
                    >
                      <TextArea rows={6} placeholder="Announcement content" disabled={selected.status === 'published'} />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: screens.sm ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
                      <Form.Item name="priority" label="Priority">
                        <Select
                          disabled={selected.status === 'published'}
                          options={[
                            { value: 'urgent', label: 'Urgent' },
                            { value: 'high', label: 'High' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'low', label: 'Low' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="publishAt" label="Publish At">
                        <DatePicker
                          showTime
                          style={{ width: '100%' }}
                          disabled={selected.status === 'published'}
                        />
                      </Form.Item>
                      <Form.Item name="expiresAt" label="Expires At" style={{ gridColumn: screens.sm ? 'span 2' : 'auto' }}>
                        <DatePicker style={{ width: '100%' }} disabled={selected.status === 'published'} />
                      </Form.Item>
                    </div>
                  </Form>

                  <div style={{ padding: 16, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Live Preview - Landing Page</Title>
                    <div style={{
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: 8,
                      overflow: 'auto',
                      height: isMobile ? 500 : 600,
                      maxHeight: '70vh',
                      position: 'relative'
                    }}>
                      
                      {/* Actual Home Page Components with live preview */}
                      <Layout style={{ minHeight: '100%', background: token.colorBgContainer }}>
                        <div style={{ position: 'relative' }}>
                          <HomeHeader />
                          {/* Overlay to prevent clicking header links */}
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            zIndex: 1101,
                            cursor: 'not-allowed',
                            pointerEvents: 'auto'
                          }} />
                        </div>
                        <Layout.Content style={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Two-panel Hero with Collapsible Announcements */}
                          <div style={{ 
                            background: token.colorBgContainer,
                            padding: screens.md ? '60px 50px' : '40px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            position: 'relative'
                          }}>
                            {(() => {
                              const hasMaintenanceNotice = previewMaintenance.active || previewMaintenance.scheduled
                              const hasAnnouncements = hasMaintenanceNotice || previewAnnouncements.length > 0 || (selected && formValues.title)
                              
                              const previewCollapseItems = []

                              if (hasMaintenanceNotice) {
                                previewCollapseItems.push({
                                  key: 'maintenance-notice',
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>{previewMaintenance.active ? 'Maintenance Underway' : 'Scheduled Maintenance'}</span>
                                    </div>
                                  ),
                                  children: (
                                    <div>
                                      {(previewMaintenance.scheduledStartAt || previewMaintenance.expectedResumeAt) && (
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                          {previewMaintenance.scheduledStartAt
                                            ? `Starts: ${dayjs(previewMaintenance.scheduledStartAt).format('MMM D, YYYY h:mm A')}`
                                            : `Expected back: ${dayjs(previewMaintenance.expectedResumeAt).format('MMM D, YYYY h:mm A')}`}
                                        </Text>
                                      )}
                                      <Paragraph style={{ marginBottom: 0 }}>
                                        {previewMaintenance.message || "We're performing scheduled maintenance. Some features may be temporarily unavailable."}
                                      </Paragraph>
                                    </div>
                                  ),
                                })
                              }
                              
                              if (selected && formValues.title) {
                                previewCollapseItems.push({
                                  key: 'preview',
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>{formValues.title}</span>
                                      <Tag color="blue" size="small" style={{ marginLeft: 'auto' }}>PREVIEW</Tag>
                                    </div>
                                  ),
                                  children: (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {selected?.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY h:mm A') : 'Just now'}
                                      </Text>
                                      <Paragraph style={{ marginBottom: 0 }}>
                                        {formValues.body || 'No content'}
                                      </Paragraph>
                                    </div>
                                  ),
                                })
                              }
                              
                              previewAnnouncements.slice(0, 3).forEach((ann, idx) => {
                                previewCollapseItems.push({
                                  key: `announcement-${idx + 1}`,
                                  label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span>{ann.title}</span>
                                    </div>
                                  ),
                                  children: (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {ann.createdAt ? dayjs(ann.createdAt).format('MMM D, YYYY h:mm A') : '-'}
                                      </Text>
                                      <Paragraph style={{ marginBottom: 0 }}>
                                        {ann.body}
                                      </Paragraph>
                                    </div>
                                  ),
                                })
                              })

                              const defaultActiveKey = hasMaintenanceNotice
                                ? ['maintenance-notice']
                                : (selected && formValues.title ? ['preview'] : ['announcement-1'])
                              
                              return (
                                <div style={{ 
                                  maxWidth: '1200px', 
                                  width: '100%',
                                  display: 'grid',
                                  gridTemplateColumns: hasAnnouncements && screens.md ? '1fr 1fr' : '1fr',
                                  gap: screens.md ? 60 : 40,
                                  alignItems: 'start'
                                }}>
                                  {/* Left Panel - Hero Text */}
                                  <div style={{ textAlign: (hasAnnouncements && screens.md) ? 'left' : 'center' }}>
                                    <Title level={1} style={{ 
                                      marginBottom: '8px', 
                                      fontSize: screens.md ? '56px' : '36px',
                                      fontWeight: 700,
                                      lineHeight: 1.1
                                    }}>
                                      <span style={{ color: BRAND_COLORS.blue }}>Business </span>
                                      <span style={{ color: BRAND_COLORS.red }}>Permit </span>
                                      <span style={{ color: BRAND_COLORS.yellow }}>Processing</span>
                                    </Title>
                                    <Title level={2} style={{ 
                                      margin: 0, 
                                      fontSize: screens.md ? '40px' : '28px',
                                      fontWeight: 700,
                                      color: token.colorText
                                    }}>
                                      Made Simpler.
                                    </Title>
                                  </div>

                                  {/* Right Panel - Announcements Collapsible */}
                                  {hasAnnouncements && (
                                    <div>
                                      <Title level={4} style={{ marginBottom: 16 }}>
                                        Announcements
                                      </Title>
                                      <Collapse
                                        items={previewCollapseItems}
                                        defaultActiveKey={defaultActiveKey}
                                        style={{ background: token.colorBgContainer }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </Layout.Content>
                        <div style={{ position: 'relative' }}>
                          <HomeFooter />
                          {/* Overlay to prevent clicking footer links */}
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            zIndex: 10,
                            cursor: 'not-allowed',
                            pointerEvents: 'auto'
                          }} />
                        </div>
                      </Layout>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'audit-logs',
              label: (
                <span>
                  <HistoryOutlined style={{ marginRight: 8 }} />
                  History
                </span>
              ),
              children: (
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Text type="secondary">
                      History for announcement operations (create, edit, delete). Click a row for full audit details.
                    </Text>
                    <Button icon={<DownloadOutlined />} onClick={handleExportAuditLogs}>
                      Export CSV
                    </Button>
                  </div>
                  
                  {auditLogsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <Spin />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <Empty description="No history found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <>
                      <Table
                        dataSource={auditLogs}
                        scroll={{ x: 1000 }}
                        columns={[
                          {
                            title: 'Date & Time',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
                            width: 180,
                          },
                          {
                            title: 'Event Type',
                            dataIndex: 'action',
                            key: 'action',
                            render: (action) => {
                              const actionColors = {
                                announcement_created: 'green',
                                announcement_updated: 'blue',
                                announcement_deleted: 'red',
                              }
                              return (
                                <Tag color={actionColors[action] || 'default'}>
                                  {action?.replace('announcement_', '').replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                                </Tag>
                              )
                            }
                          },
                          {
                            title: 'Changed By',
                            dataIndex: 'userEmail',
                            key: 'userEmail',
                            render: (email, record) => (
                              <div>
                                <Text>{email || 'Unknown'}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {record.role || 'Admin'}
                                </Text>
                              </div>
                            ),
                          },
                          {
                            title: 'Field',
                            dataIndex: 'fieldChanged',
                            key: 'fieldChanged',
                            render: (field) => field || '-',
                          },
                          {
                            title: 'Old Value',
                            dataIndex: 'oldValue',
                            key: 'oldValue',
                            render: (value) => (
                              <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 220 }}>
                                {value || '-'}
                              </Text>
                            ),
                          },
                          {
                            title: 'New Value',
                            dataIndex: 'newValue',
                            key: 'newValue',
                            render: (value) => (
                              <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 220 }}>
                                {value || '-'}
                              </Text>
                            ),
                          },
                        ]}
                        pagination={{
                          current: auditLogsPage,
                          total: auditLogsTotal,
                          pageSize: 20,
                          onChange: (page) => {
                            setAuditLogsPage(page)
                            fetchAuditLogs(page)
                          },
                          showSizeChanger: false
                        }}
                        rowKey="_id"
                        size="small"
                        onRow={(record) => ({
                          onClick: () => openAuditLog(record),
                          style: { cursor: 'pointer' },
                        })}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  ) : (
    <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Empty description="Select an announcement to view details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </div>
  )

  const unpublishModal = (
    <Modal
      title="Unpublish Announcement"
      open={unpublishModalVisible}
      onOk={handleUnpublish}
      onCancel={() => setUnpublishModalVisible(false)}
      okText="Unpublish"
      cancelText="Cancel"
      confirmLoading={saving}
      okButtonProps={{ danger: true }}
    >
      <p>Are you sure you want to unpublish this announcement?</p>
      <p>This will move the announcement back to draft status and it will no longer appear on the landing page.</p>
      {selected && (
        <div style={{ marginTop: 16, padding: 12, background: token.colorBgLayout, borderRadius: 6 }}>
          <Text strong>{selected.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Created: {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
          </Text>
        </div>
      )}
    </Modal>
  )

  const deleteModal = (
    <Modal
      title="Delete Announcement"
      open={deleteModalVisible}
      onOk={handleDelete}
      onCancel={() => setDeleteModalVisible(false)}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
      confirmLoading={saving}
    >
      <p>Are you sure you want to delete this announcement draft?</p>
      <p>This action cannot be undone.</p>
      {selected && (
        <div style={{ marginTop: 16, padding: 12, background: token.colorBgLayout, borderRadius: 6 }}>
          <Text strong>{selected.title || '(Untitled)'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Created: {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
          </Text>
        </div>
      )}
    </Modal>
  )

  const auditLogModal = (
    <Modal
      title="Audit Entry Details"
      open={auditLogModalVisible}
      onOk={() => setAuditLogModalVisible(false)}
      onCancel={() => setAuditLogModalVisible(false)}
      footer={null}
    >
      {selectedAuditLog ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <Text strong>Event:</Text> {selectedAuditLog.action}
          </div>
          <div>
            <Text strong>User:</Text> {selectedAuditLog.userEmail || 'Unknown'}
          </div>
          <div>
            <Text strong>Date:</Text> {selectedAuditLog.createdAt ? dayjs(selectedAuditLog.createdAt).format('MMM D, YYYY h:mm A') : '-'}
          </div>
          <div>
            <Text strong>Field:</Text> {selectedAuditLog.fieldChanged || '-'}
          </div>
          <div>
            <Text strong>Old Value:</Text>
            <div style={{ marginTop: 4 }}>
              <Text code>{selectedAuditLog.oldValue || '-'}</Text>
            </div>
          </div>
          <div>
            <Text strong>New Value:</Text>
            <div style={{ marginTop: 4 }}>
              <Text code>{selectedAuditLog.newValue || '-'}</Text>
            </div>
          </div>
          <div>
            <Text strong>Details:</Text>
            <div style={{ marginTop: 4 }}>
              <Text>{selectedAuditLog.details || '-'}</Text>
            </div>
          </div>
        </div>
      ) : (
        <Empty description="No audit details available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Modal>
  )

  const infoModal = (
    <Modal
      title="Announcements"
      open={infoOpen}
      onOk={() => setInfoOpen(false)}
      onCancel={() => setInfoOpen(false)}
      footer={null}
    >
      <p>Use announcements to post important updates to the public landing page. Drafts can be prepared, scheduled for future publication, and set to expire after they are no longer relevant.</p>
      <p>Once an announcement is posted or becomes visible, it can no longer be deleted. Published announcements can be unpublished to remove them from public view.</p>
      <p>Announcements can also be filtered by status and priority while editing.</p>
    </Modal>
  )

  if (isMobile) {
    const mobileBody = (
      <div style={{ padding: 16 }}>
        {selected ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 120px)',
              overflow: 'hidden',
            }}
          >
            <Button onClick={() => setSelected(null)} style={{ marginBottom: 16 }}>← Back to list</Button>

            <div style={{ flex: 1, minHeight: 0 }}>
              {detailContent}
            </div>
          </div>
        ) : (
          listContent
        )}
      </div>
    )

    return embedded ? (
      <>
        {mobileBody}
        {unpublishModal}
        {deleteModal}
        {auditLogModal}
        {infoModal}
      </>
    ) : (
      <>
        <AdminLayout pageTitle="Announcements" pageIcon={<NotificationOutlined />}>
          {mobileBody}
        </AdminLayout>
        {unpublishModal}
        {deleteModal}
        {auditLogModal}
        {infoModal}
      </>
    )
  }

  const desktopBody = (
    <div
      style={{
        height: 'calc(100vh - 120px)',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Splitter
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Splitter.Panel min="280px" defaultSize="30%" max="40%" style={{ overflow: 'hidden', background: token.colorBgContainer }}>
          {listContent}
        </Splitter.Panel>
        <Splitter.Panel min="60%" defaultSize="80%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', background: token.colorBgContainer }}>
          {detailContent}
        </Splitter.Panel>
      </Splitter>
    </div>
  )

  return embedded ? (
    <>
      {desktopBody}
      {unpublishModal}
      {deleteModal}
      {auditLogModal}
      {infoModal}
    </>
  ) : (
    <>
      <AdminLayout pageTitle="Announcements" pageIcon={<NotificationOutlined />}>
        {desktopBody}
      </AdminLayout>
      {unpublishModal}
      {deleteModal}
      {auditLogModal}
      {infoModal}
    </>
  )
}
