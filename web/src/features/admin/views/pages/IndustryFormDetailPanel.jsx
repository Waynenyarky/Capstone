import { useState, useEffect, useMemo, useCallback } from 'react'
import { Tabs, Empty, Select, Button, Space, Spin, App, Typography, Form, Dropdown } from 'antd'
import { PlusOutlined, StopOutlined, PauseCircleOutlined, PlayCircleOutlined, DownOutlined, EditOutlined } from '@ant-design/icons'
import { getFormGroup, createFormGroupVersion, retireFormGroup, deactivateFormGroup, reactivateFormGroup } from '../../services'
import FormDefinitionEditorPanel from './FormDefinitionEditorPanel'
import { DeactivateFormModal } from './formDefinitions/components'
import { FORM_TYPES, INDUSTRY_LABELS, STATUS_LABELS, STATUS_ICONS, DEACTIVATE_REASON_TEMPLATES } from './formDefinitions/constants'

const { Text, Title } = Typography

const FORM_TYPE_TABS = FORM_TYPES.map((t) => ({ key: t.value, label: t.label }))

function FormTypeTabContent({
  group,
  formTypeLabel,
  onRetired,
}) {
  const { message, modal } = App.useApp()
  const [deactivateForm] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [versions, setVersions] = useState([])
  const [groupData, setGroupData] = useState(group)
  const [selectedDefinitionId, setSelectedDefinitionId] = useState(null)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivateReasonTemplate, setDeactivateReasonTemplate] = useState('maintenance')
  const [deactivating, setDeactivating] = useState(false)
  const [retiring, setRetiring] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  useEffect(() => {
    setGroupData(group)
  }, [group])

  const loadVersions = useCallback(async () => {
    if (!group?._id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getFormGroup(group._id)
      setGroupData(res.group || group)
      const loadedVersions = res.versions || []
      setVersions(loadedVersions)
      // Auto-select the published version, or the latest draft
      const published = loadedVersions.find((v) => v.status === 'published')
      const latestDraft = loadedVersions.find((v) => v.status === 'draft')
      const autoSelect = published || latestDraft || loadedVersions[0]
      if (autoSelect) {
        setSelectedDefinitionId(autoSelect._id)
      }
    } catch (err) {
      console.error('Failed to load versions:', err)
      message.error('Failed to load form versions')
    } finally {
      setLoading(false)
    }
  }, [group?._id, group, message])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const handleCreateVersion = useCallback(async () => {
    if (!group?._id) return
    try {
      setCreating(true)
      const res = await createFormGroupVersion(group._id)
      message.success(`Version ${res.definition?.version} created`)
      await loadVersions()
      if (res.definition?._id) {
        setSelectedDefinitionId(res.definition._id)
      }
    } catch (err) {
      console.error('Failed to create version:', err)
      message.error(err.message || 'Failed to create version')
    } finally {
      setCreating(false)
    }
  }, [group?._id, loadVersions, message])

  const handleSelectVersion = useCallback((def) => {
    setSelectedDefinitionId(def._id)
  }, [])

  const selectedVersion = versions.find((v) => v._id === selectedDefinitionId)
  const isDeactivated = groupData?.deactivatedUntil && new Date(groupData.deactivatedUntil) > new Date()
  const StatusIconComponent = isDeactivated ? PauseCircleOutlined : (STATUS_ICONS[selectedVersion?.status] || EditOutlined)
  const statusIconColor = isDeactivated ? '#faad14' : (selectedVersion?.status === 'published' ? '#52c41a' : selectedVersion?.status === 'archived' ? '#ff4d4f' : undefined)

  const handleRetire = useCallback(() => {
    if (!group?._id) return
    modal.confirm({
      title: 'Retire Form Group',
      content: 'This will hide the form group from the default list. Versions remain for history. You can show retired groups using the filter.',
      okText: 'Retire',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setRetiring(true)
          await retireFormGroup(group._id)
          message.success('Form group retired')
          onRetired?.()
        } catch (err) {
          message.error(err.message || 'Failed to retire form group')
        } finally {
          setRetiring(false)
        }
      },
    })
  }, [group?._id, message, modal, onRetired])

  const openDeactivateModal = useCallback(() => {
    setDeactivateModalOpen(true)
    setDeactivateReasonTemplate('maintenance')
    deactivateForm.resetFields()
  }, [deactivateForm])

  const closeDeactivateModal = useCallback(() => {
    setDeactivateModalOpen(false)
    setDeactivateReasonTemplate('maintenance')
    deactivateForm.resetFields()
  }, [deactivateForm])

  const handleDeactivateSubmit = useCallback(async () => {
    if (!group?._id) return
    try {
      const values = await deactivateForm.validateFields()
      let reason = ''
      if (values.reasonTemplate === 'custom') {
        reason = values.reason || ''
      } else {
        const template = DEACTIVATE_REASON_TEMPLATES.find((t) => t.value === values.reasonTemplate)
        reason = template?.message || ''
      }
      setDeactivating(true)
      await deactivateFormGroup(group._id, {
        deactivatedUntil: values.deactivatedUntil.toISOString(),
        reason,
      })
      message.success('Form group deactivated')
      closeDeactivateModal()
      const res = await getFormGroup(group._id)
      setGroupData(res.group || null)
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Failed to deactivate form group')
    } finally {
      setDeactivating(false)
    }
  }, [group?._id, deactivateForm, message, closeDeactivateModal])

  const handleReactivate = useCallback(async () => {
    if (!group?._id) return
    try {
      setReactivating(true)
      await reactivateFormGroup(group._id)
      message.success('Form group reactivated')
      const res = await getFormGroup(group._id)
      setGroupData(res.group || null)
    } catch (err) {
      message.error(err.message || 'Failed to reactivate form group')
    } finally {
      setReactivating(false)
    }
  }, [group?._id, message])

  const versionOptions = useMemo(() => {
    return versions.map((v) => ({
      value: v._id,
      label: `v${v.version} (${v.status === 'published' ? 'Active' : v.status})`,
    }))
  }, [versions])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!group) {
    return (
      <Empty
        description={`No ${formTypeLabel} form for this industry yet.`}
        style={{ marginTop: 48 }}
      >
        <Text type="secondary">Use "New Definition" in the header to create one.</Text>
      </Empty>
    )
  }

  if (versions.length === 0) {
    return (
      <Empty
        description="No versions yet"
        style={{ marginTop: 48 }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateVersion}
          loading={creating}
        >
          Create first version
        </Button>
      </Empty>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed version selector bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--ant-color-border)', flexShrink: 0 }}>
        <Text type="secondary">Version:</Text>
        <Select
          style={{ minWidth: 180 }}
          value={selectedDefinitionId}
          onChange={(v) => setSelectedDefinitionId(v)}
          options={versionOptions}
        />
        <Button
          icon={<PlusOutlined />}
          onClick={handleCreateVersion}
          loading={creating}
          disabled={!!group.retiredAt}
        >
          New version
        </Button>
        {!group.retiredAt && (
          <Dropdown
            menu={{
              items: [
                ...(isDeactivated
                  ? [{ key: 'reactivate', label: 'Reactivate', icon: <PlayCircleOutlined />, onClick: handleReactivate }]
                  : [{ key: 'deactivate', label: 'Deactivate', icon: <PauseCircleOutlined />, onClick: openDeactivateModal }]),
                { type: 'divider' },
                { key: 'retire', label: 'Retire', icon: <StopOutlined />, danger: true, onClick: handleRetire },
              ],
            }}
            trigger={['click']}
          >
            <Button
              icon={<StatusIconComponent style={statusIconColor ? { color: statusIconColor } : undefined} />}
              loading={retiring || reactivating}
            >
              <Space size={4}>
                <span>{isDeactivated ? 'Deactivated' : STATUS_LABELS[selectedVersion?.status] || 'Draft'}</span>
                <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
              </Space>
            </Button>
          </Dropdown>
        )}
      </div>
      <DeactivateFormModal
        open={deactivateModalOpen}
        form={deactivateForm}
        reasonTemplate={deactivateReasonTemplate}
        onReasonTemplateChange={setDeactivateReasonTemplate}
        onCancel={closeDeactivateModal}
        onOk={handleDeactivateSubmit}
        confirmLoading={deactivating}
      />
      {/* Scrollable form content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {selectedDefinitionId && (
          <FormDefinitionEditorPanel
            key={selectedDefinitionId}
            definitionId={selectedDefinitionId}
            groupId={group._id}
            viewOnly={versions.find((v) => v._id === selectedDefinitionId)?.status !== 'draft'}
            onSelectVersion={handleSelectVersion}
            onRetired={() => {
              loadVersions()
              onRetired?.()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function IndustryFormDetailPanel({
  industryScope,
  groupsByType,
  onRetired,
}) {
  const tabItems = useMemo(() => {
    return FORM_TYPE_TABS.map(({ key, label }) => {
      const group = groupsByType?.[key]
      return {
        key,
        label: `${label}${group ? (group.retiredAt ? ' (Retired)' : '') : ' (None)'}`,
        children: (
          <FormTypeTabContent
            group={group}
            formTypeLabel={label}
            onRetired={onRetired}
          />
        ),
      }
    })
  }, [groupsByType, onRetired])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Title level={4} style={{ margin: 0, padding: '16px 16px 0' }}>
        {INDUSTRY_LABELS[industryScope] || industryScope || ''}
      </Title>
      <Tabs
        items={tabItems}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0, flexShrink: 0 }}
        className="industry-form-tabs"
      />
      <style>{`
        .industry-form-tabs .ant-tabs-content-holder {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .industry-form-tabs .ant-tabs-content {
          height: 100%;
        }
        .industry-form-tabs .ant-tabs-tabpane {
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
