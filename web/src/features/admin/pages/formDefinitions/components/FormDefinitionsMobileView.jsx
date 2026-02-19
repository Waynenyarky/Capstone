import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Button, Typography, theme, Space, Badge, Empty, Modal, Spin, message, Form, Alert, Tag, Row, Col, Card } from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  SendOutlined,
  DashboardOutlined,
  PlusOutlined,
  HistoryOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'

import { FORM_TYPES, STATUS_COLORS, GENERAL_PERMIT_PREVIEW_CATEGORIES } from '../constants'
import DraftsModal from './DraftsModal'
import AddVersionModal from './AddVersionModal'
import FormContentEditor from './FormContentEditor'
import FormPreview from './FormPreview'
import DeactivateFormModal from './DeactivateFormModal'
import FormDefinitionsLogsTab from './FormDefinitionsLogsTab'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

import {
  getFormGroups,
  getFormGroupStats,
  getFormGroup,
  createFormGroup,
  createFormGroupVersion,
  getFormDefinition,
  updateFormDefinition,
  deleteFormDefinition,
  submitForApproval,
  deactivateFormGroup,
  reactivateFormGroup,
} from '@/features/admin/services/formDefinitionService'

const { Text, Title } = Typography

const OVERVIEW_KEY = '__overview__'
const LOGS_KEY = '__logs__'

const VERSION_STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending',
  published: 'Active',
  archived: 'Archived',
}

function formatDraftDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Strip " - All Industries" (or en-dash) from form/definition display name */
function formDisplayTitle(name) {
  return (name || '').replace(/\s*[–-]\s*All Industries$/i, '').trim() || name || ''
}

const OVERVIEW_CARD_COLORS = {
  active: '#52c41a',
  pending: '#fa8c16',
  deactivated: '#faad14',
  retired: '#8c8c8c',
}

function isGroupDeactivated(group) {
  return group?.deactivatedUntil && new Date(group.deactivatedUntil) > new Date()
}

function FormDefinitionsMobileView({ refreshKey = 0, onLastUpdated } = {}) {
  const { token } = theme.useToken()
  const editorRef = useRef(null)
  const [deactivateForm] = Form.useForm()
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  // Navigation
  const [selectedNav, setSelectedNav] = useState(OVERVIEW_KEY)

  // The selected form type is derived from selectedNav when it's a form type key
  const selectedFormType = (!selectedNav || selectedNav === OVERVIEW_KEY || selectedNav === LOGS_KEY)
    ? null
    : selectedNav

  // API data
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ activated: 0, deactivated: 0, retired: 0, pending: 0 })
  const [formGroup, setFormGroup] = useState(null)
  const [versions, setVersions] = useState([])
  const [currentDefinition, setCurrentDefinition] = useState(null)
  const [drafts, setDrafts] = useState([])

  // Version selection (no status filter)
  const [selectedVersion, setSelectedVersion] = useState(null)

  // Draft editing
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draftCreatedAt, setDraftCreatedAt] = useState(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Modals
  const [draftsModalOpen, setDraftsModalOpen] = useState(false)
  const [addVersionModalOpen, setAddVersionModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [reasonTemplate, setReasonTemplate] = useState('maintenance')
  const [generalPermitPreviewCategory, setGeneralPermitPreviewCategory] = useState('cooperative')

  // Computed
  const isOverview = selectedNav === OVERVIEW_KEY
  const isLogs = selectedNav === LOGS_KEY
  const industryScope = 'all'
  const isFormPage = !isOverview && !isLogs && !!selectedFormType

  const selectedFormLabel = FORM_TYPES.find((t) => t.value === selectedFormType)?.label ?? selectedFormType ?? ''
  const selectedPageLabel = isOverview
    ? 'Overview'
    : isLogs
      ? 'History'
      : selectedFormLabel

  const TitleIcon = isOverview
    ? DashboardOutlined
    : isLogs
      ? HistoryOutlined
      : FileTextOutlined

  // Version dropdown — exclude drafts (those are in the Drafts modal)
  const versionOptions = versions
    .filter((v) => v.status !== 'draft')
    .map((v) => {
      const statusLabel = VERSION_STATUS_LABELS[v.status] || v.status
      return { value: v._id, label: `v${v.version} (${statusLabel})` }
    })

  const hasPreviousVersion = versions.length > 0

  // ─── Data fetching ──────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await getFormGroupStats()
      if (res?.success) setStats(res.stats)
      onLastUpdated?.(new Date())
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }, [onLastUpdated])

  const loadFormGroupForSelection = useCallback(async () => {
    if (!isFormPage || isLogs) return
    setLoading(true)
    try {
      const res = await getFormGroups({
        formType: selectedFormType,
        industryScope,
        limit: 1,
      })
      const groups = res?.groups || []
      if (groups.length > 0) {
        const group = groups[0]
        setFormGroup(group)
        const groupRes = await getFormGroup(group._id)
        if (groupRes?.success) {
          const allVersions = groupRes.versions || []
          setVersions(allVersions)
          setDrafts(allVersions.filter((v) => v.status === 'draft'))

          // Auto-select: prefer published (active), else latest non-draft
          const published = allVersions.find((v) => v.status === 'published')
          const toSelect = published || allVersions.find((v) => v.status !== 'draft') || allVersions[0]
          if (toSelect) {
            setSelectedVersion(toSelect._id)
            setCurrentDefinition(toSelect)
          } else {
            setSelectedVersion(null)
            setCurrentDefinition(null)
          }
        }
      } else {
        setFormGroup(null)
        setVersions([])
        setDrafts([])
        setSelectedVersion(null)
        setCurrentDefinition(null)
      }
    } catch (err) {
      console.error('Failed to load form group', err)
    } finally {
      setLoading(false)
    }
  }, [selectedFormType, industryScope, isFormPage, isLogs])

  useEffect(() => { loadStats() }, [loadStats, refreshKey])
  useEffect(() => {
    if (isFormPage) {
      setIsEditingDraft(false)
      setHasUnsavedChanges(false)
      loadFormGroupForSelection()
    }
  }, [loadFormGroupForSelection, isFormPage, refreshKey])
  useEffect(() => {
    if (selectedVersion && versions.length > 0) {
      const found = versions.find((v) => v._id === selectedVersion)
      if (found) setCurrentDefinition(found)
    }
  }, [selectedVersion, versions])

  // ─── Actions ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!currentDefinition || !editorRef.current) return
    setSaving(true)
    try {
      const sections = editorRef.current.getSections()
      await runWithStepUp(async (stepUpToken) => {
        const res = await updateFormDefinition(currentDefinition._id, { sections }, { stepUpToken })
        if (res?.success) {
          message.success('Draft saved')
          setHasUnsavedChanges(false)
          setCurrentDefinition(res.definition)
        } else {
          message.error('Failed to save draft')
        }
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') message.error(err?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!currentDefinition) return
    Modal.confirm({
      title: 'Delete draft',
      content: 'Are you sure you want to delete this draft? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runWithStepUp(async (stepUpToken) => {
            await deleteFormDefinition(currentDefinition._id, { stepUpToken })
            message.success('Draft deleted')
            setIsEditingDraft(false)
            setHasUnsavedChanges(false)
            loadFormGroupForSelection()
          })
        } catch (err) {
          if (err?.message !== 'Step-up cancelled') message.error(err?.message || 'Failed to delete draft')
        }
      },
    })
  }

  const handlePublish = () => {
    if (!currentDefinition) return
    Modal.confirm({
      title: 'Submit for approval',
      content: 'This form will be submitted for approval. It will only be published once other admins have approved it.',
      okText: 'Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await runWithStepUp(async (stepUpToken) => {
            const opts = { stepUpToken }
            if (editorRef.current) {
              const sections = editorRef.current.getSections()
              await updateFormDefinition(currentDefinition._id, { sections }, opts)
            }
            const res = await submitForApproval(currentDefinition._id, opts)
            if (res?.success) {
              message.success('Form submitted for approval')
              setIsEditingDraft(false)
              setHasUnsavedChanges(false)
              loadFormGroupForSelection()
              loadStats()
            } else {
              message.error(res?.error?.message || 'Failed to submit for approval')
            }
          })
        } catch (err) {
          if (err?.message !== 'Step-up cancelled') message.error(err?.message || 'Failed to submit for approval')
        }
      },
    })
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: 'Unsaved changes',
        content: 'You have unsaved changes. Are you sure you want to leave?',
        okText: 'Leave',
        cancelText: 'Stay',
        okButtonProps: { danger: true },
        onOk: () => { setIsEditingDraft(false); setHasUnsavedChanges(false) },
      })
    } else {
      setIsEditingDraft(false)
      setHasUnsavedChanges(false)
    }
  }

  const handleAddVersion = async (source) => {
    try {
      await runWithStepUp(async (stepUpToken) => {
        const opts = { stepUpToken }
        let group = formGroup
        if (!group) {
          const createRes = await createFormGroup({ formType: selectedFormType, industryScope }, opts)
          if (!createRes?.success) { message.error('Failed to create form group'); return }
          group = createRes.group
          setFormGroup(group)
          setCurrentDefinition(createRes.definition)
          setVersions([createRes.definition])
          setSelectedVersion(createRes.definition._id)
          setDraftCreatedAt(new Date())
          setIsEditingDraft(true)
          return
        }
        const res = await createFormGroupVersion(group._id, opts)
        if (res?.success) {
          const newDef = res.definition
          if (source === 'previous' && versions.length > 0) {
            const latestPublished = versions.find((v) => v.status === 'published') || versions[0]
            if (latestPublished?.sections?.length > 0) {
              await updateFormDefinition(newDef._id, { sections: latestPublished.sections }, opts)
            }
          }
          await loadFormGroupForSelection()
          setSelectedVersion(newDef._id)
          setCurrentDefinition(newDef)
          setDraftCreatedAt(new Date())
          setIsEditingDraft(true)
          message.success('New version created')
        } else {
          message.error('Failed to create new version')
        }
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') message.error(err?.message || 'Failed to create version')
    }
  }

  const handleViewDraft = async (draft) => {
    setDraftsModalOpen(false)
    try {
      const res = await getFormDefinition(draft._id || draft.id)
      if (res?.success) {
        setCurrentDefinition(res.definition)
        setSelectedVersion(res.definition._id)
        setDraftCreatedAt(res.definition.createdAt)
        setIsEditingDraft(true)
      }
    } catch (err) {
      message.error('Failed to load draft')
    }
  }

  const handleDeleteDraft = async (draft) => {
    try {
      await runWithStepUp(async (stepUpToken) => {
        await deleteFormDefinition(draft._id || draft.id, { stepUpToken })
        message.success('Draft deleted')
        loadFormGroupForSelection()
      })
    } catch (err) {
      if (err?.message !== 'Step-up cancelled') message.error(err?.message || 'Failed to delete draft')
    }
  }

  const handleDeactivate = async () => {
    if (!formGroup) return
    try {
      const values = await deactivateForm.validateFields()
      setDeactivateLoading(true)
      const reason = values.reasonTemplate === 'custom' ? values.reason : values.reasonTemplate
      await runWithStepUp(async (stepUpToken) => {
        await deactivateFormGroup(formGroup._id, { deactivatedUntil: values.deactivatedUntil.toISOString(), reason }, { stepUpToken })
        message.success('Form group deactivated')
        setDeactivateModalOpen(false)
        deactivateForm.resetFields()
        loadFormGroupForSelection()
        loadStats()
      })
    } catch (err) {
      if (err?.message === 'Step-up cancelled' || err?.errorFields) return
      message.error(err?.message || 'Failed to deactivate')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!formGroup) return
    try {
      await reactivateFormGroup(formGroup._id)
      message.success('Form group reactivated')
      loadFormGroupForSelection()
      loadStats()
    } catch (err) {
      message.error(err?.message || 'Failed to reactivate')
    }
  }

  const groupDeactivated = isGroupDeactivated(formGroup)

  return (
    <>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {/* Top nav */}
      <div
        style={{
          flexShrink: 0,
          padding: 12,
          borderBottom: `1px solid ${token.colorBorder}`,
          background: token.colorBgLayout,
          overflowX: 'auto',
        }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Navigation
        </Text>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.form-def-industries-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="form-def-industries-scroll" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { value: OVERVIEW_KEY, label: 'Overview', icon: DashboardOutlined },
              { value: LOGS_KEY, label: 'History', icon: HistoryOutlined },
              ...FORM_TYPES.map(ft => ({ value: ft.value, label: ft.label, icon: FileTextOutlined })),
            ].map(({ value, label, icon: Icon }) => {
              const isSelected = selectedNav === value
              return (
                <div
                  key={value}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedNav(value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedNav(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: token.borderRadiusLG,
                    cursor: 'pointer',
                    flexShrink: 0,
                    background: isSelected ? token.colorBgContainer : token.colorFillQuaternary,
                    border: isSelected ? `1px solid ${token.colorBorder}` : 'none',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {Icon && (
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: token.borderRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
                        color: isSelected ? token.colorPrimary : token.colorTextSecondary,
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ fontSize: 14 }} />
                    </span>
                  )}
                  <Text strong={isSelected} type={isSelected ? undefined : 'secondary'} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                    {label}
                  </Text>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 200, padding: 12, background: token.colorBgContainer, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {TitleIcon && (
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: token.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: token.colorFillTertiary,
                color: token.colorPrimary,
              }}
            >
              <TitleIcon style={{ fontSize: 16 }} />
            </span>
          )}
            <Title level={4} style={{ margin: 0 }}>{selectedPageLabel}</Title>
        </div>

        {isOverview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>Form summary</Text>
              <Row gutter={[12, 12]}>
                {[
                  { key: 'active', label: 'Active forms', value: stats.activated, icon: CheckCircleOutlined },
                  { key: 'pending', label: 'Pending forms', value: stats.pending || 0, icon: ClockCircleOutlined },
                  { key: 'deactivated', label: 'Deactivated forms', value: stats.deactivated, icon: StopOutlined },
                  { key: 'retired', label: 'Retired forms', value: stats.retired, icon: HistoryOutlined },
                ].map(({ key, label, value, icon: Icon }) => (
                  <Col xs={12} sm={12} key={key}>
                    <Card size="small" style={{ height: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: token.borderRadius,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background: OVERVIEW_CARD_COLORS[key] || token.colorPrimary,
                              color: '#fff',
                            }}
                          >
                            <Icon style={{ fontSize: 14 }} />
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        ) : isLogs ? (
          <div style={{ minHeight: 300 }}>
            <FormDefinitionsLogsTab />
          </div>
        ) : (
          <>
            {/* Filter / action bar */}
            {!isEditingDraft && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <Space size="small" wrap>
                  {versionOptions.length > 0 && (
                    <Select value={selectedVersion} onChange={setSelectedVersion} options={versionOptions} style={{ minWidth: 150 }} placeholder="Version" />
                  )}
                </Space>
                <Space size="small">
                  <Badge count={drafts.length} size="small">
                    <Button icon={<FileTextOutlined />} onClick={() => setDraftsModalOpen(true)} disabled={drafts.length === 0} size="middle">Drafts</Button>
                  </Badge>
                  <Button type="primary" icon={<PlusOutlined />} size="middle" onClick={() => setAddVersionModalOpen(true)}>Add version</Button>
                </Space>
              </div>
            )}

            {/* Draft editing toolbar */}
            {isEditingDraft && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <Space size="small">
                  <Button icon={<ArrowLeftOutlined />} size="middle" onClick={handleBack}>Back</Button>
                  <Text style={{ fontSize: 13 }}>Draft created {formatDraftDate(draftCreatedAt)}</Text>
                </Space>
                <Space size="small">
                  <Button
                    icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />}
                    size="middle"
                    onClick={() => setIsPreviewMode((p) => !p)}
                  >
                    {isPreviewMode ? 'Editor' : 'Preview'}
                  </Button>
                  <Button icon={<SaveOutlined />} size="middle" onClick={handleSave} loading={saving} disabled={isPreviewMode}>Save</Button>
                  <Button icon={<DeleteOutlined />} danger size="middle" onClick={handleDelete} disabled={isPreviewMode}>Delete</Button>
                  <Button type="primary" icon={<SendOutlined />} size="middle" onClick={handlePublish} disabled={isPreviewMode}>Publish</Button>
                </Space>
              </div>
            )}

            {/* Modals */}
            <AddVersionModal
              open={addVersionModalOpen}
              onClose={() => setAddVersionModalOpen(false)}
              industryLabel="all industries"
              formTypeLabel={selectedFormLabel}
              hasPreviousVersion={hasPreviousVersion}
              hasGlobalForm={false}
              onConfirm={handleAddVersion}
            />
            <DraftsModal
              open={draftsModalOpen}
              onClose={() => setDraftsModalOpen(false)}
              drafts={drafts.map((d) => ({
                id: d._id,
                createdAt: formatDraftDate(d.createdAt),
                createdBy: d.createdBy?.firstName || d.createdBy?.email || 'Admin',
                lastEditedAt: formatDraftDate(d.updatedAt),
                lastEditedBy: d.updatedBy?.firstName || d.updatedBy?.email || 'Admin',
              }))}
              onView={handleViewDraft}
              onDelete={handleDeleteDraft}
            />
            <DeactivateFormModal
              open={deactivateModalOpen}
              form={deactivateForm}
              reasonTemplate={reasonTemplate}
              onReasonTemplateChange={setReasonTemplate}
              onCancel={() => { setDeactivateModalOpen(false); deactivateForm.resetFields() }}
              onOk={handleDeactivate}
              confirmLoading={deactivateLoading}
            />

            {/* Deactivation banner */}
            {groupDeactivated && (
              <Alert
                type="warning"
                showIcon
                message={`Deactivated until ${formatDraftDate(formGroup.deactivatedUntil)}`}
                description={formGroup.deactivateReason || undefined}
                action={<Button size="small" onClick={handleReactivate}>Reactivate</Button>}
                style={{ marginBottom: 16 }}
              />
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Spin />
              </div>
            ) : isEditingDraft && currentDefinition ? (
              /* ── Editing a draft ── */
              isPreviewMode ? (
                <>
                  {selectedFormType === 'general_permit' && (
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ marginRight: 8 }}>Preview as category:</Text>
                      <Select
                        value={generalPermitPreviewCategory}
                        onChange={setGeneralPermitPreviewCategory}
                        options={GENERAL_PERMIT_PREVIEW_CATEGORIES}
                        style={{ minWidth: 200, width: '100%' }}
                      />
                    </div>
                  )}
                  <FormPreview
                    sections={currentDefinition.sections}
                    isMobile
                    formValues={selectedFormType === 'general_permit' ? { generalPermitCategory: generalPermitPreviewCategory } : undefined}
                  />
                </>
              ) : (
                <FormContentEditor
                  ref={editorRef}
                  initialSections={currentDefinition.sections}
                  onChange={() => setHasUnsavedChanges(true)}
                  isMobile
                  definitionId={currentDefinition._id}
                />
              )
            ) : currentDefinition ? (
              /* ── Viewing a version (always preview for published/archived) ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text strong>{formDisplayTitle(currentDefinition.name || selectedFormLabel)}</Text>
                    <Text type="secondary">v{currentDefinition.version}</Text>
                    <Tag color={STATUS_COLORS[currentDefinition.status === 'published' ? 'active' : currentDefinition.status === 'pending_approval' ? 'pending' : currentDefinition.status === 'archived' ? 'retired' : 'pending']}>
                      {VERSION_STATUS_LABELS[currentDefinition.status] || currentDefinition.status}
                    </Tag>
                  </div>
                  <Space size="small">
                    {formGroup && !groupDeactivated && versions.some((v) => v.status === 'published') && (
                      <Button danger size="small" onClick={() => setDeactivateModalOpen(true)}>Deactivate</Button>
                    )}
                  </Space>
                </div>

                {currentDefinition.status === 'archived' && (
                  <Alert
                    type="info"
                    showIcon
                    message="Archived version (read-only)"
                    description="To make changes, create a new version."
                    style={{ marginBottom: 4 }}
                  />
                )}

                {currentDefinition.sections?.length > 0 ? (
                  <>
                    {selectedFormType === 'general_permit' && (
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ marginRight: 8 }}>Preview as category:</Text>
                        <Select
                          value={generalPermitPreviewCategory}
                          onChange={setGeneralPermitPreviewCategory}
                          options={GENERAL_PERMIT_PREVIEW_CATEGORIES}
                          style={{ minWidth: 200, width: '100%' }}
                        />
                      </div>
                    )}
                    <FormPreview
                      key={currentDefinition._id + '-preview'}
                      sections={currentDefinition.sections}
                      isMobile
                      formValues={selectedFormType === 'general_permit' ? { generalPermitCategory: generalPermitPreviewCategory } : undefined}
                    />
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">This version has no sections yet.</Text>} />
                )}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <Text strong>No form content yet</Text>
                    <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                      No {selectedFormLabel.toLowerCase()} form has been defined.
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                      Use &quot;Add version&quot; above to create one.
                    </Text>
                  </div>
                }
                style={{ marginTop: 32, marginBottom: 32 }}
              />
            )}
          </>
        )}
      </div>
    </div>
    {stepUpModal}
  </>
  )
}

export default FormDefinitionsMobileView

