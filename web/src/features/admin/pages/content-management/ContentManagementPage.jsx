import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { App, Select, Card, Spin, theme, Grid, Col, Splitter, Typography, Drawer } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import AdminLayout from '../../components/AdminLayout'
import useContentManagement from './hooks/useContentManagement'
import useAnnouncementsTab from './hooks/useAnnouncementsTab'
import { CONTENT_TYPES, CONTENT_TYPE_CONFIG } from './constants/contentManagement.constants'
import ContentManagementToolbar from './components/ContentManagementToolbar'
import ContentItemList from './components/ContentItemList'
import AnnouncementEditor from './components/AnnouncementEditor'
import FaqSectionEditor from './components/FaqSectionEditor'
import InstructionEditor from './components/InstructionEditor'
import ApplicationProcessPlaceholder from './components/ApplicationProcessPlaceholder'
import { get, put } from '@/lib/http.js'

const { Paragraph } = Typography

export default function ContentManagementPage() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const {
    contentType,
    setContentType,
    selectedItem,
    setSelectedItem,
  } = useContentManagement()

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState(null)
  const filterWrapperRef = useRef(null)

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length

  // ─── Announcements data ───────────────────────────────────────────────────────
  const announcementsPublic = useAnnouncementsTab('public')
  const announcementsStaff = useAnnouncementsTab('staff')

  // ─── FAQ data ─────────────────────────────────────────────────────────────────
  const [faqSections, setFaqSections] = useState([])
  const [faqLoading, setFaqLoading] = useState(true)

  const fetchFaqSections = useCallback(async () => {
    try {
      setFaqLoading(true)
      const res = await get('/api/admin/cms/faq')
      setFaqSections(Array.isArray(res) ? res : [])
    } catch {
      message.error('Failed to load FAQ sections')
    } finally {
      setFaqLoading(false)
    }
  }, [message])

  useEffect(() => { fetchFaqSections() }, [fetchFaqSections])

  const handleSaveFaq = useCallback(async (slotId, values, publish = false) => {
    await put(`/api/admin/cms/faq/${slotId}?publish=${publish}`, values)
    await fetchFaqSections()
  }, [fetchFaqSections])

  // ─── Instructions data ────────────────────────────────────────────────────────
  const [instructions, setInstructions] = useState([])
  const [instructionsLoading, setInstructionsLoading] = useState(true)

  const fetchInstructions = useCallback(async () => {
    try {
      setInstructionsLoading(true)
      const res = await get('/api/admin/cms/instructions')
      setInstructions(Array.isArray(res) ? res : [])
    } catch {
      message.error('Failed to load instructions')
    } finally {
      setInstructionsLoading(false)
    }
  }, [message])

  useEffect(() => { fetchInstructions() }, [fetchInstructions])

  const handleSaveInstruction = useCallback(async (slotId, values, publish = false) => {
    await put(`/api/admin/cms/instructions/${slotId}?publish=${publish}`, values)
    await fetchInstructions()
  }, [fetchInstructions])

  // ─── Filtered items based on content type ───────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = []
    let loading = false

    switch (contentType) {
      case 'public-announcements':
        items = announcementsPublic.announcements
        loading = announcementsPublic.loading
        break
      case 'staff-announcements':
        items = announcementsStaff.announcements
        loading = announcementsStaff.loading
        break
      case 'faqs':
        items = faqSections
        loading = faqLoading
        break
      case 'instructions':
        items = instructions
        loading = instructionsLoading
        break
      case 'application-processes':
        items = []
        loading = false
        break
      default:
        items = []
        loading = false
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter((item) => {
        const title = (item.title || '').toLowerCase()
        const body = (item.body || item.description || '').toLowerCase()
        return title.includes(q) || body.includes(q)
      })
    }

    if (statusFilter) {
      items = items.filter((item) => item?.status === statusFilter)
    }

    if (priorityFilter) {
      items = items.filter((item) => item?.priority === priorityFilter)
    }

    return { items, loading }
  }, [contentType, search, statusFilter, priorityFilter, announcementsPublic, announcementsStaff, faqSections, faqLoading, instructions, instructionsLoading])

  useEffect(() => { setCurrentPage(1) }, [search, contentType, statusFilter, priorityFilter])

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

  const clearFilters = () => {
    setStatusFilter(null)
    setPriorityFilter(null)
  }

  const config = useMemo(() => CONTENT_TYPE_CONFIG[contentType] || {}, [contentType])

  // ─── Render item card ───────────────────────────────────────────────────────────
  const renderItem = useCallback((item, selectedId, onSelect, token) => {
    const isSelected = selectedId && (selectedId === item._id || selectedId === item.slotId)
    return (
      <Col span={24} key={item._id || item.slotId}>
        <Card
          size="small"
          hoverable
          onClick={() => onSelect(item)}
          title={item.slotId}
          style={{
            cursor: 'pointer',
            border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
          }}
        >
          <Paragraph type="secondary" ellipsis={{ rows: 4 }} style={{ fontSize: 12, marginBottom: 0 }}>
            {item.body || item.description || ''}
          </Paragraph>
        </Card>
      </Col>
    )
  }, [])

  // ─── Right panel content ───────────────────────────────────────────────────────
  const rightPanelContent = useMemo(() => {
    if (config.placeholder) {
      return <ApplicationProcessPlaceholder />
    }

    switch (contentType) {
      case 'public-announcements':
        return (
          <AnnouncementEditor
            selected={selectedItem}
            saving={announcementsPublic.saving}
            onSave={announcementsPublic.handleSave}
            onDelete={announcementsPublic.handleDelete}
            audience="public"
          />
        )
      case 'staff-announcements':
        return (
          <AnnouncementEditor
            selected={selectedItem}
            saving={announcementsStaff.saving}
            onSave={announcementsStaff.handleSave}
            onDelete={announcementsStaff.handleDelete}
            audience="staff"
          />
        )
      case 'faqs':
        return <FaqSectionEditor selected={selectedItem} onSave={handleSaveFaq} />
      case 'instructions':
        return <InstructionEditor selected={selectedItem} onSave={handleSaveInstruction} />
      default:
        return null
    }
  }, [contentType, config, selectedItem, announcementsPublic, announcementsStaff, handleSaveFaq, handleSaveInstruction])

  if (isMobile) {
    // Mobile view: select field + list, then drawer for details
    return (
      <AdminLayout pageTitle="Content Management" pageIcon={null}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: token.colorBgContainer, overflow: 'hidden' }}>
          <div style={{ padding: 16, flexShrink: 0 }}>
            <Select
              value={contentType}
              onChange={setContentType}
              style={{ width: '100%', marginBottom: 16 }}
              options={CONTENT_TYPES.map((t) => ({ value: t.key, label: t.label }))}
            />
            <ContentManagementToolbar
              searchValue={search}
              onSearchChange={setSearch}
              onToggleFilter={() => setFilterOpen((prev) => !prev)}
              activeFilterCount={activeFilterCount}
              onAdd={config.showAddButton ? (contentType === 'public-announcements' ? announcementsPublic.handleCreateDraft : announcementsStaff.handleCreateDraft) : undefined}
              showAddButton={config.showAddButton}
              token={token}
              filterOpen={filterOpen}
              filterWrapperRef={filterWrapperRef}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              clearFilters={clearFilters}
              showFilters={contentType === 'public-announcements' || contentType === 'staff-announcements'}
            />
          </div>
          {filteredItems.loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <ContentItemList
              items={filteredItems.items}
              loading={filteredItems.loading}
              selectedId={selectedItem?._id || selectedItem?.slotId}
              onSelect={setSelectedItem}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              total={filteredItems.items.length}
              renderItem={renderItem}
              token={token}
              contentType={contentType}
              style={{ flex: 1, minHeight: 0 }}
            />
          )}
        </div>
        <Drawer
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          placement="bottom"
          height="100%"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
          {rightPanelContent}
        </Drawer>
      </AdminLayout>
    )
  }

  // Desktop view: two-panel layout matching maintenance feature
  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: 12, paddingBottom: 0 }}>
        <Select
          value={contentType}
          onChange={setContentType}
          style={{ width: '100%' }}
          options={CONTENT_TYPES.map((t) => ({ value: t.key, label: t.label }))}
        />
        <ContentManagementToolbar
          searchValue={search}
          onSearchChange={setSearch}
          onToggleFilter={() => setFilterOpen((prev) => !prev)}
          activeFilterCount={activeFilterCount}
          onAdd={config.showAddButton ? (contentType === 'public-announcements' ? announcementsPublic.handleCreateDraft : announcementsStaff.handleCreateDraft) : undefined}
          showAddButton={config.showAddButton}
          token={token}
          filterOpen={filterOpen}
          filterWrapperRef={filterWrapperRef}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          clearFilters={clearFilters}
          showFilters={contentType === 'public-announcements' || contentType === 'staff-announcements'}
        />
      </div>
      <ContentItemList
        items={filteredItems.items}
        loading={filteredItems.loading}
        selectedId={selectedItem?._id || selectedItem?.slotId}
        onSelect={setSelectedItem}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        total={filteredItems.items.length}
        renderItem={renderItem}
        token={token}
        style={{ marginTop: 12 }}
        contentType={contentType}
      />
    </div>
  )

  const desktopContent = (
    <Splitter style={{ height: '100%' }}>
      <Splitter.Panel min="30%" defaultSize="30%" style={{ overflow: 'hidden' }}>
        {leftPanelContent}
      </Splitter.Panel>
      <Splitter.Panel min="50%" defaultSize="70%" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanelContent}
      </Splitter.Panel>
    </Splitter>
  )

  return (
    <AdminLayout pageTitle="Content Management" pageIcon={<FileTextOutlined />}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 400,
          overflow: 'hidden',
          background: token.colorBgContainer,
        }}
      >
        {desktopContent}
      </div>
    </AdminLayout>
  )
}
