import React, { useState, useCallback, useMemo } from 'react'
import {
  Button,
  Space,
  Typography,
  Select,
  Drawer,
  Modal,
  Form,
  Grid,
  Empty,
  theme,
} from 'antd'
import {
  PlusOutlined,
  FormOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { useAdminFormDefinitionsPage } from './useAdminFormDefinitionsPage'
import { useFormDefinitionsSearch } from './useFormDefinitionsSearch'
import { useFormDefinitionsInfoModal } from './useFormDefinitionsInfoModal'
import FormDefinitionsInfoModal from './FormDefinitionsInfoModal'
import IndustryFormDetailPanel from './IndustryFormDetailPanel'
import AdminLayout from '../components/AdminLayout'

import {
  FORM_TYPES,
  INDUSTRY_OPTIONS,
  INDUSTRY_LABELS,
  STATUS_OPTIONS,
} from './formDefinitions/constants'
import {
  FilterDropdownContent,
  MobileView,
  DesktopView,
} from './formDefinitions/components'

dayjs.extend(relativeTime)

const { Text } = Typography

export default function AdminFormDefinitions() {
  const screens = Grid.useBreakpoint()
  const { token } = theme.useToken()
  const isMobile = !screens.md

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileFormDrawerOpen, setMobileFormDrawerOpen] = useState(false)
  const [selectedIndustryScope, setSelectedIndustryScope] = useState(null)

  // Callbacks
  const onCreateSuccess = useCallback(
    (res) => {
      if (res?.group?._id) {
        setSelectedIndustryScope(res.group.industryScope)
        if (isMobile) setMobileFormDrawerOpen(true)
      }
    },
    [isMobile]
  )

  const {
    groups,
    loading,
    lastRefreshedAt,
    stats,
    auditLog,
    filters,
    createModalOpen,
    createForm,
    loadGroups,
    handleFilterChange,
    openCreateModal,
    closeCreateModal,
    handleCreate,
  } = useAdminFormDefinitionsPage({ onCreateSuccess })

  // Computed values
  const displayStats = useMemo(() => {
    const api = stats || {}
    const hasApiStats = (api.activated ?? 0) + (api.deactivated ?? 0) + (api.retired ?? 0) > 0
    if (hasApiStats) return { activated: api.activated ?? 0, deactivated: api.deactivated ?? 0, retired: api.retired ?? 0 }
    const now = new Date()
    let activated = 0, deactivated = 0, retired = 0
    for (const g of groups) {
      if (g.retiredAt) retired++
      else if (g.deactivatedUntil && new Date(g.deactivatedUntil) > now) deactivated++
      else activated++
    }
    return { activated, deactivated, retired }
  }, [stats, groups])

  const industryRows = useMemo(() => {
    const byScope = {}
    for (const opt of INDUSTRY_OPTIONS) {
      byScope[opt.value] = { industryScope: opt.value, groupsByType: {} }
    }
    for (const g of groups) {
      if (!byScope[g.industryScope]) byScope[g.industryScope] = { industryScope: g.industryScope, groupsByType: {} }
      byScope[g.industryScope].groupsByType[g.formType] = g
    }
    return INDUSTRY_OPTIONS.map((opt) => byScope[opt.value] || { industryScope: opt.value, groupsByType: {} })
  }, [groups])

  const selectedGroupsByType = useMemo(() => {
    if (!selectedIndustryScope) return null
    return industryRows.find((r) => r.industryScope === selectedIndustryScope)?.groupsByType ?? null
  }, [selectedIndustryScope, industryRows])

  // Handlers
  const handleRowClick = useCallback(
    (record) => {
      setSelectedIndustryScope(record.industryScope)
      if (isMobile) setMobileFormDrawerOpen(true)
    },
    [isMobile]
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedIndustryScope(null)
    setMobileFormDrawerOpen(false)
  }, [])

  // Search hook
  const { value: searchValue, setValue: setSearchValue, submitNow: submitSearchNow } =
    useFormDefinitionsSearch({
      initialValue: filters.search || '',
      onDebouncedChange: (next) => handleFilterChange('search', next || ''),
      debounceMs: 350,
    })

  const { open: infoModalOpen, openModal: openInfoModal, closeModal: closeInfoModal } =
    useFormDefinitionsInfoModal()

  // Table columns
  const columns = [
    {
      title: 'Name',
      key: 'industry',
      width: 280,
      ellipsis: true,
      render: (_, record) => {
        const industry = INDUSTRY_LABELS[record.industryScope] || record.industryScope || ''
        return <Text>{industry}</Text>
      },
    },
  ]

  return (
    <AdminLayout
      pageTitle="Form Definitions"
      pageIcon={<FormOutlined />}
      headerActions={
        <Space size="middle">
          {lastRefreshedAt && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last updated: {dayjs(lastRefreshedAt).format('MMM D, h:mm A')}
            </Text>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadGroups} aria-label="Refresh">
            {isMobile ? 'Refresh' : ''}
          </Button>
          <Button icon={<InfoCircleOutlined />} onClick={openInfoModal} type={isMobile ? 'text' : ''} aria-label="About">
            {isMobile ? 'Info' : ''}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            New Definition
          </Button>
        </Space>
      }
    >
      {isMobile ? (
        <MobileView
          displayStats={displayStats}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          submitSearchNow={submitSearchNow}
          setFiltersOpen={setFiltersOpen}
          industryRows={industryRows}
          columns={columns}
          loading={loading}
          handleRowClick={handleRowClick}
        />
      ) : (
        <DesktopView
          token={token}
          displayStats={displayStats}
          industryRows={industryRows}
          columns={columns}
          loading={loading}
          selectedIndustryScope={selectedIndustryScope}
          handleRowClick={handleRowClick}
          auditLog={auditLog}
          loadGroups={loadGroups}
          selectedGroupsByType={selectedGroupsByType}
        />
      )}

      <FormDefinitionsInfoModal open={infoModalOpen} onClose={closeInfoModal} isMobile={isMobile} />

      {/* Mobile form drawer */}
      {isMobile && (
        <Drawer
          title={
            selectedIndustryScope
              ? INDUSTRY_LABELS[selectedIndustryScope] || selectedIndustryScope
              : 'Forms'
          }
          placement="bottom"
          open={mobileFormDrawerOpen}
          onClose={handleCloseDetail}
          height="90%"
          styles={{ body: { padding: 0, overflow: 'hidden' } }}
        >
          {selectedIndustryScope ? (
            <IndustryFormDetailPanel
              industryScope={selectedIndustryScope}
              groupsByType={selectedGroupsByType}
              onRetired={loadGroups}
            />
          ) : (
            <Empty description="Select an industry to view or edit forms" />
          )}
        </Drawer>
      )}

      {/* Mobile filters drawer */}
      <Drawer
        title="Filters"
        placement="bottom"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        height="auto"
      >
        <FilterDropdownContent
          filters={filters}
          onFilterChange={handleFilterChange}
          formTypes={FORM_TYPES}
          industryOptions={INDUSTRY_OPTIONS}
          statusOptions={STATUS_OPTIONS}
        />
      </Drawer>

      {/* Create modal */}
      <Modal
        title="New Form Group"
        open={createModalOpen}
        onCancel={closeCreateModal}
        onOk={handleCreate}
        okText="Create"
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="formType" label="Form Type" rules={[{ required: true, message: 'Form type is required' }]}>
            <Select placeholder="Select form type" options={FORM_TYPES} />
          </Form.Item>
          <Form.Item name="industryScope" label="Industry" rules={[{ required: true, message: 'Industry is required' }]}>
            <Select placeholder="Select industry scope" options={INDUSTRY_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  )
}
