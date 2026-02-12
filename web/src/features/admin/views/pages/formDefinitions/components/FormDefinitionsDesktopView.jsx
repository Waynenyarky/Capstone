import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Button, Typography, theme, Space, Badge, Empty, Modal, Spin, message, Form, Alert, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  SendOutlined,
  DashboardOutlined,
  PlusOutlined,
  HistoryOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons'

import { FORM_TYPES, FORM_DEFINITIONS_INDUSTRIES_ONLY, STATUS_COLORS, ACTION_LABELS } from '../constants'
import DraftsModal from './DraftsModal'
import AddVersionModal from './AddVersionModal'
import FormContentEditor from './FormContentEditor'
import FormPreview from './FormPreview'
import DeactivateFormModal from './DeactivateFormModal'

import {
  getFormGroups,
  getFormGroupStats,
  getFormDefinitionsAuditLog,
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
const GLOBAL_FORMS_KEY = '__global_forms__'

/** Human-readable status for a definition */
const VERSION_STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending',
  published: 'Active',
  archived: 'Archived',
}

function OverviewPanelItem({ label, value, token }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: token.colorFillQuaternary,
        borderRadius: token.borderRadius,
        marginBottom: 8,
      }}
    >
      <Text>{label}</Text>
      <Text type="secondary">{value}</Text>
    </div>
  )
}

function formatDraftDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FormDefinitionsDesktopView() {
  const { token } = theme.useToken()
  const editorRef = useRef(null)
  const [deactivateForm] = Form.useForm()

  // Navigation
  const [selectedIndustry, setSelectedIndustry] = useState(OVERVIEW_KEY)

  // Form selection
  const [selectedFormType, setSelectedFormType] = useState(FORM_TYPES[0]?.value ?? 'registration')

  // API data
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ activated: 0, deactivated: 0, retired: 0, pending: 0 })
  const [auditLog, setAuditLog] = useState([])
  const [formGroup, setFormGroup] = useState(null)
  const [versions, setVersions] = useState([])
  const [currentDefinition, setCurrentDefinition] = useState(null)
  const [drafts, setDrafts] = useState([])

  // Version selection (no status filter — we always load all versions)
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

  // Computed
  const isOverview = selectedIndustry === OVERVIEW_KEY
  const isLogs = selectedIndustry === LOGS_KEY
  const isGlobalForms = selectedIndustry === GLOBAL_FORMS_KEY
  const industryScope = isGlobalForms ? 'all' : selectedIndustry
  const isIndustryPage = !isOverview && !isLogs

  const selectedIndustryLabel = isOverview
    ? 'Overview'
    : isLogs
      ? 'Logs'
      : isGlobalForms
        ? 'Global Forms'
        : (FORM_DEFINITIONS_INDUSTRIES_ONLY.find((o) => o.value === selectedIndustry)?.label ?? selectedIndustry)

  const TitleIcon = isOverview
    ? DashboardOutlined
    : isLogs
      ? HistoryOutlined
      : isGlobalForms
        ? GlobalOutlined
        : (FORM_DEFINITIONS_INDUSTRIES_ONLY.find((o) => o.value === selectedIndustry)?.icon ?? null)

  const selectedFormLabel = FORM_TYPES.find((t) => t.value === selectedFormType)?.label ?? selectedFormType

  // Build version dropdown options with status labels
  // Active (published) version first, then others in reverse chronological order
  const versionOptions = versions
    .filter((v) => v.status !== 'draft') // drafts are accessed via the Drafts button, not the dropdown
    .map((v) => {
      const statusLabel = VERSION_STATUS_LABELS[v.status] || v.status
      return { value: v._id, label: `v${v.version} (${statusLabel})` }
    })

  const hasPreviousVersion = versions.length > 0
  const hasGlobalForm = false // TODO: check if a global form group exists for this form type

  // Form group status for the status badge
  const groupStatusLabel = formGroup
    ? isGroupDeactivated(formGroup)
      ? 'Deactivated'
      : formGroup.retiredAt
        ? 'Retired'
        : versions.some((v) => v.status === 'published')
          ? 'Active'
          : 'No active version'
    : null
  const groupStatusColor = formGroup
    ? isGroupDeactivated(formGroup)
      ? STATUS_COLORS.deactivated
      : formGroup.retiredAt
        ? STATUS_COLORS.retired
        : versions.some((v) => v.status === 'published')
          ? STATUS_COLORS.active
          : STATUS_COLORS.pending
    : null

  // ─── Data fetching ──────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await getFormGroupStats()
      if (res?.success) {
        setStats(res.stats)
      }
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }, [])

  const loadAuditLog = useCallback(async () => {
    try {
      const res = await getFormDefinitionsAuditLog({ limit: 20 })
      if (res?.success) {
        setAuditLog(res.entries || [])
      }
    } catch (err) {
      console.error('Failed to load audit log', err)
    }
  }, [])

  const loadFormGroupForSelection = useCallback(async () => {
    if (!isIndustryPage || isLogs) return

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

        // Load ALL versions for this group (no status filter)
        const groupRes = await getFormGroup(group._id)
        if (groupRes?.success) {
          const allVersions = groupRes.versions || []

          setVersions(allVersions)
          setDrafts(allVersions.filter((v) => v.status === 'draft'))

          // Auto-select: prefer the published (active) version, else the latest
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
  }, [selectedFormType, industryScope, isIndustryPage, isLogs])

  // Load overview stats on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Load audit log when Overview or Logs tab selected
  useEffect(() => {
    if (isOverview || isLogs) loadAuditLog()
  }, [isOverview, isLogs, loadAuditLog])

  // Load form group when industry/formType changes
  useEffect(() => {
    if (isIndustryPage) {
      setIsEditingDraft(false)
      setHasUnsavedChanges(false)
      loadFormGroupForSelection()
    }
  }, [loadFormGroupForSelection, isIndustryPage])

  // Load definition details when selected version changes
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
      const res = await updateFormDefinition(currentDefinition._id, { sections })
      if (res?.success) {
        message.success('Draft saved')
        setHasUnsavedChanges(false)
        setCurrentDefinition(res.definition)
      } else {
        message.error('Failed to save draft')
      }
    } catch (err) {
      message.error(err?.message || 'Failed to save draft')
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
          await deleteFormDefinition(currentDefinition._id)
          message.success('Draft deleted')
          setIsEditingDraft(false)
          setHasUnsavedChanges(false)
          loadFormGroupForSelection()
        } catch (err) {
          message.error(err?.message || 'Failed to delete draft')
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
          // Save first
          if (editorRef.current) {
            const sections = editorRef.current.getSections()
            await updateFormDefinition(currentDefinition._id, { sections })
          }
          const res = await submitForApproval(currentDefinition._id)
          if (res?.success) {
            message.success('Form submitted for approval')
            setIsEditingDraft(false)
            setHasUnsavedChanges(false)
            loadFormGroupForSelection()
            loadStats()
          } else {
            message.error(res?.error?.message || 'Failed to submit for approval')
          }
        } catch (err) {
          message.error(err?.message || 'Failed to submit for approval')
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
        onOk: () => {
          setIsEditingDraft(false)
          setHasUnsavedChanges(false)
        },
      })
    } else {
      setIsEditingDraft(false)
      setHasUnsavedChanges(false)
    }
  }

  const handleAddVersion = async (source) => {
    try {
      let group = formGroup

      // Create form group if none exists
      if (!group) {
        const createRes = await createFormGroup({
          formType: selectedFormType,
          industryScope,
        })
        if (!createRes?.success) {
          message.error('Failed to create form group')
          return
        }
        group = createRes.group
        setFormGroup(group)
        setCurrentDefinition(createRes.definition)
        setVersions([createRes.definition])
        setSelectedVersion(createRes.definition._id)
        setDraftCreatedAt(new Date())
        setIsEditingDraft(true)
        return
      }

      // Create new version in existing group
      const res = await createFormGroupVersion(group._id)
      if (res?.success) {
        const newDef = res.definition

        // If source is 'previous', copy sections from latest version
        if (source === 'previous' && versions.length > 0) {
          const latestPublished = versions.find((v) => v.status === 'published') || versions[0]
          if (latestPublished?.sections?.length > 0) {
            await updateFormDefinition(newDef._id, { sections: latestPublished.sections })
          }
        }

        // Reload
        await loadFormGroupForSelection()
        // Find and select the new draft
        setSelectedVersion(newDef._id)
        setCurrentDefinition(newDef)
        setDraftCreatedAt(new Date())
        setIsEditingDraft(true)
        message.success('New version created')
      } else {
        message.error('Failed to create new version')
      }
    } catch (err) {
      message.error(err?.message || 'Failed to create version')
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
      await deleteFormDefinition(draft._id || draft.id)
      message.success('Draft deleted')
      loadFormGroupForSelection()
    } catch (err) {
      message.error(err?.message || 'Failed to delete draft')
    }
  }

  const handleDeactivate = async () => {
    if (!formGroup) return
    try {
      const values = await deactivateForm.validateFields()
      setDeactivateLoading(true)
      const reason = values.reasonTemplate === 'custom' ? values.reason : values.reasonTemplate
      await deactivateFormGroup(formGroup._id, {
        deactivatedUntil: values.deactivatedUntil.toISOString(),
        reason,
      })
      message.success('Form group deactivated')
      setDeactivateModalOpen(false)
      deactivateForm.resetFields()
      loadFormGroupForSelection()
      loadStats()
    } catch (err) {
      if (err?.errorFields) return // Validation error
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

  // ─── Render nav item ────────────────────────────────────────────
  const renderNavItem = ({ value, label, icon: Icon }, isSelected) => (
    <div
      key={value}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedIndustry(value)}
      onKeyDown={(e) => e.key === 'Enter' && setSelectedIndustry(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px',
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        background: isSelected ? token.colorBgContainer : 'transparent',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = token.colorFillTertiary
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      {Icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: token.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? token.colorFillTertiary : token.colorFillQuaternary,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}
      <Text
        strong={isSelected}
        type={isSelected ? undefined : 'secondary'}
        style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}
      >
        {label}
      </Text>
    </div>
  )

  // ─── Render ─────────────────────────────────────────────────────
  const groupDeactivated = isGroupDeactivated(formGroup)

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: 400,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
      }}
    >
      {/* Left panel */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorder}`,
          padding: 12,
          overflowY: 'auto',
          background: token.colorBgLayout,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {renderNavItem({ value: OVERVIEW_KEY, label: 'Overview', icon: DashboardOutlined }, isOverview)}
          {renderNavItem({ value: LOGS_KEY, label: 'Logs', icon: HistoryOutlined }, isLogs)}
          {renderNavItem({ value: GLOBAL_FORMS_KEY, label: 'Global Forms', icon: GlobalOutlined }, isGlobalForms)}
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Industries
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FORM_DEFINITIONS_INDUSTRIES_ONLY.map(({ value, label, icon: Icon }) =>
            renderNavItem({ value, label, icon: Icon }, selectedIndustry === value)
          )}
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          overflow: 'hidden',
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 16px 12px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isIndustryPage ? 12 : 0 }}>
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
                <TitleIcon style={{ fontSize: 18 }} />
              </span>
            )}
            <Title level={4} style={{ margin: 0 }}>{selectedIndustryLabel}</Title>
            {/* Status badge for the form group */}
            {isIndustryPage && !isEditingDraft && groupStatusLabel && (
              <Tag color={groupStatusColor} style={{ marginLeft: 4 }}>{groupStatusLabel}</Tag>
            )}
          </div>

          {/* Filter/action bar (not editing) */}
          {isIndustryPage && !isEditingDraft && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Space size="middle">
                <Select
                  value={selectedFormType}
                  onChange={setSelectedFormType}
                  options={FORM_TYPES}
                  style={{ minWidth: 200 }}
                  placeholder="Select form type"
                />
                {versionOptions.length > 0 && (
                  <Select
                    value={selectedVersion}
                    onChange={(val) => setSelectedVersion(val)}
                    options={versionOptions}
                    style={{ minWidth: 180 }}
                    placeholder="Version"
                  />
                )}
              </Space>
              <Space size="middle">
                <Badge count={drafts.length} size="small">
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => setDraftsModalOpen(true)}
                    disabled={drafts.length === 0}
                  >
                    Drafts
                  </Button>
                </Badge>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddVersionModalOpen(true)}>
                  Add version
                </Button>
              </Space>
            </div>
          )}

          {/* Draft editing toolbar */}
          {isIndustryPage && isEditingDraft && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Space size="middle">
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                <Text>Draft created {formatDraftDate(draftCreatedAt)}</Text>
              </Space>
              <Space size="middle">
                <Button
                  icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />}
                  onClick={() => setIsPreviewMode((p) => !p)}
                >
                  {isPreviewMode ? 'Editor' : 'Preview'}
                </Button>
                <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={isPreviewMode}>Save</Button>
                <Button icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={isPreviewMode}>Delete</Button>
                <Button type="primary" icon={<SendOutlined />} onClick={handlePublish} disabled={isPreviewMode}>Publish</Button>
              </Space>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {isOverview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>Form summary</Text>
                <OverviewPanelItem label="Active forms" value={stats.activated} token={token} />
                <OverviewPanelItem label="Pending forms" value={stats.pending || 0} token={token} />
                <OverviewPanelItem label="Deactivated forms" value={stats.deactivated} token={token} />
                <OverviewPanelItem label="Retired forms" value={stats.retired} token={token} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text strong>Recent activity</Text>
                  <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => { loadStats(); loadAuditLog(); }}>Refresh</Button>
                </div>
                {auditLog.length > 0 ? (
                  auditLog.slice(0, 5).map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 16px',
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                        marginBottom: 6,
                        fontSize: 13,
                      }}
                    >
                      <Text>{ACTION_LABELS[entry.action] || entry.action}: {entry.name || entry.formType} v{entry.version}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {entry.user ? `by ${entry.user.firstName || entry.user.email}` : ''}
                        {' · '}
                        {formatDraftDate(entry.at)}
                      </Text>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: 24,
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                      textAlign: 'center',
                    }}
                  >
                    <Text type="secondary">No recent activity</Text>
                  </div>
                )}
              </div>
            </div>
          ) : isLogs ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text strong>Form definition logs</Text>
                <Button type="link" size="small" icon={<ReloadOutlined />} onClick={loadAuditLog}>Refresh</Button>
              </div>
              {auditLog.length > 0 ? (
                auditLog.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 16px',
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <Text strong>{ACTION_LABELS[entry.action] || entry.action}</Text>
                    <Text>{' '}{entry.name || entry.formType} v{entry.version}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {entry.user ? `by ${entry.user.firstName || entry.user.email}` : ''}
                      {' · '}
                      {formatDraftDate(entry.at)}
                    </Text>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: 24,
                    background: token.colorFillQuaternary,
                    borderRadius: token.borderRadius,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary">Form definition logs will appear here</Text>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Modals */}
              <AddVersionModal
                open={addVersionModalOpen}
                onClose={() => setAddVersionModalOpen(false)}
                industryLabel={isGlobalForms ? 'all industries' : selectedIndustryLabel}
                formTypeLabel={selectedFormLabel}
                hasPreviousVersion={hasPreviousVersion}
                hasGlobalForm={isGlobalForms ? false : hasGlobalForm}
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
                  message={`This form group is deactivated until ${formatDraftDate(formGroup.deactivatedUntil)}`}
                  description={formGroup.deactivateReason || undefined}
                  action={
                    <Button size="small" onClick={handleReactivate}>Reactivate</Button>
                  }
                  style={{ marginBottom: 16 }}
                />
              )}

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                  <Spin />
                </div>
              ) : isEditingDraft && currentDefinition ? (
                /* ── Editing a draft ── */
                isPreviewMode ? (
                  <FormPreview sections={currentDefinition.sections} />
                ) : (
                  <FormContentEditor
                    ref={editorRef}
                    initialSections={currentDefinition.sections}
                    onChange={() => setHasUnsavedChanges(true)}
                    definitionId={currentDefinition._id}
                  />
                )
              ) : currentDefinition ? (
                /* ── Viewing a version (always preview mode for published/archived) ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong>{currentDefinition.name || selectedFormLabel}</Text>
                      <Text type="secondary">v{currentDefinition.version}</Text>
                      <Tag color={STATUS_COLORS[currentDefinition.status === 'published' ? 'active' : currentDefinition.status === 'pending_approval' ? 'pending' : currentDefinition.status === 'archived' ? 'retired' : 'pending']}>
                        {VERSION_STATUS_LABELS[currentDefinition.status] || currentDefinition.status}
                      </Tag>
                    </div>
                    <Space>
                      {formGroup && !groupDeactivated && versions.some((v) => v.status === 'published') && (
                        <Button danger onClick={() => setDeactivateModalOpen(true)}>Deactivate</Button>
                      )}
                    </Space>
                  </div>

                  {currentDefinition.status === 'archived' && (
                    <Alert
                      type="info"
                      showIcon
                      message="This is an archived version"
                      description="Past versions are read-only. To make changes, create a new version using 'Add version' above."
                      style={{ marginBottom: 8 }}
                    />
                  )}

                  {currentDefinition.sections?.length > 0 ? (
                    <FormPreview
                      key={currentDefinition._id + '-preview'}
                      sections={currentDefinition.sections}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Text type="secondary">This version has no sections yet.</Text>
                      }
                    />
                  )}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      <Text strong>No form content yet</Text>
                      <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                        No {selectedFormLabel.toLowerCase()} form has been defined{isGlobalForms ? '' : ` for ${selectedIndustryLabel}`}.
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                        Use &quot;Add version&quot; above to create one.
                      </Text>
                    </div>
                  }
                  style={{ marginTop: 48, marginBottom: 48 }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Check if a form group is currently deactivated */
function isGroupDeactivated(group) {
  return group?.deactivatedUntil && new Date(group.deactivatedUntil) > new Date()
}
