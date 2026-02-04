import { useEffect, useState, useCallback } from 'react'
import { Form, App } from 'antd'
import {
  getFormDefinition,
  updateFormDefinition,
  submitForApproval,
  cancelApproval,
  getFormGroup,
  retireFormGroup,
  deactivateFormGroup,
  reactivateFormGroup,
  createFormGroupVersion,
} from '../../../services/formDefinitionService'
import { getActiveLGUs } from '../../../services/lguService'
import { DEACTIVATE_REASON_TEMPLATES } from './constants'
import dayjs from 'dayjs'

export function useFormDefinitionEditorPanel({
  definitionId,
  viewOnlyProp = false,
  onSelectVersion,
  groupId,
  onRetired,
}) {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const [deactivateForm] = Form.useForm()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [definition, setDefinition] = useState(null)
  const [lgus, setLgus] = useState([])
  const [versions, setVersions] = useState([])
  const [group, setGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('sections')
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivateReasonTemplate, setDeactivateReasonTemplate] = useState('maintenance')
  const [deactivating, setDeactivating] = useState(false)
  const [retiring, setRetiring] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)

  const viewOnly = viewOnlyProp || definition?.status !== 'draft'
  const groupIdForActions = group?._id || definition?.formGroupId || groupId
  const isDeactivated = group?.deactivatedUntil && new Date(group.deactivatedUntil) > new Date()

  const loadDefinition = useCallback(async () => {
    if (!definitionId) return
    setLoading(true)
    try {
      const res = await getFormDefinition(definitionId)
      setDefinition(res.definition)
      form.setFieldsValue({
        formType: res.definition.formType,
        version: res.definition.version,
        name: res.definition.name,
        description: res.definition.description,
        businessTypes: res.definition.businessTypes || [],
        lguCodes: res.definition.lguCodes || [],
        effectiveFrom: res.definition.effectiveFrom ? dayjs(res.definition.effectiveFrom) : null,
        effectiveTo: res.definition.effectiveTo ? dayjs(res.definition.effectiveTo) : null,
      })
    } catch (err) {
      console.error('Failed to load form definition:', err)
      message.error('Failed to load form definition')
    } finally {
      setLoading(false)
    }
  }, [definitionId, form, message])

  const loadLGUs = useCallback(async () => {
    try {
      const res = await getActiveLGUs()
      setLgus(res.lgus || [])
    } catch (err) {
      console.error('Failed to load LGUs:', err)
    }
  }, [])

  useEffect(() => {
    loadDefinition()
    loadLGUs()
  }, [loadDefinition, loadLGUs])

  useEffect(() => {
    const id = definition?.formGroupId || groupId
    if (!id || !onSelectVersion) return
    getFormGroup(id)
      .then((res) => {
        setVersions(res.versions || [])
        setGroup(res.group || null)
      })
      .catch(() => {
        setVersions([])
        setGroup(null)
      })
  }, [definition?.formGroupId, groupId, onSelectVersion])

  const handleSave = useCallback(async () => {
    if (viewOnly) return
    try {
      setSaving(true)
      const values = await form.validateFields()
      const updateData = {
        version: values.version,
        description: values.description,
        businessTypes: values.businessTypes || [],
        lguCodes: values.lguCodes || [],
        sections: definition.sections,
        downloads: definition.downloads,
        effectiveFrom: values.effectiveFrom?.toISOString() || null,
        effectiveTo: values.effectiveTo?.toISOString() || null,
      }
      if (!definition.formGroupId) {
        updateData.name = values.name
      }
      const res = await updateFormDefinition(definitionId, updateData)
      setDefinition(res.definition)
      message.success('Form definition saved')
    } catch (err) {
      if (err.errorFields) return
      console.error('Failed to save form definition:', err)
      message.error(err.message || 'Failed to save form definition')
    } finally {
      setSaving(false)
    }
  }, [viewOnly, form, definition, definitionId, message])

  const handleSectionsChange = useCallback((newSections) => {
    setDefinition((prev) => ({ ...prev, sections: newSections }))
  }, [])

  const handleDownloadsChange = useCallback((newDownloads) => {
    setDefinition((prev) => ({ ...prev, downloads: newDownloads }))
  }, [])

  const handleSubmitForApproval = useCallback(async () => {
    try {
      await handleSave()
      await submitForApproval(definitionId)
      message.success('Form definition submitted for approval')
      loadDefinition()
    } catch (err) {
      console.error('Failed to submit for approval:', err)
      message.error(err.message || 'Failed to submit for approval')
    }
  }, [handleSave, definitionId, message, loadDefinition])

  const handleRetire = useCallback(() => {
    if (!groupIdForActions) return
    modal.confirm({
      title: 'Retire Form Group',
      content: 'This will hide the form group from the default list. Versions remain for history. You can show retired groups using the filter.',
      okText: 'Retire',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setRetiring(true)
          await retireFormGroup(groupIdForActions)
          message.success('Form group retired')
          onRetired?.()
        } catch (err) {
          message.error(err.message || 'Failed to retire form group')
        } finally {
          setRetiring(false)
        }
      },
    })
  }, [groupIdForActions, message, modal, onRetired])

  const handleCreateVersion = useCallback(async () => {
    if (!groupIdForActions) return
    try {
      setCreatingVersion(true)
      const res = await createFormGroupVersion(groupIdForActions)
      message.success(`Version ${res.definition?.version || ''} created`)
      if (res?.definition && onSelectVersion) {
        onSelectVersion(res.definition)
      }
    } catch (err) {
      console.error('Failed to create version:', err)
      message.error(err.message || 'Failed to create version')
    } finally {
      setCreatingVersion(false)
    }
  }, [groupIdForActions, message, onSelectVersion])

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
    if (!groupIdForActions) return
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
      await deactivateFormGroup(groupIdForActions, {
        deactivatedUntil: values.deactivatedUntil.toISOString(),
        reason,
      })
      message.success('Form group deactivated')
      setDeactivateModalOpen(false)
      setDeactivateReasonTemplate('maintenance')
      deactivateForm.resetFields()
      const res = await getFormGroup(groupIdForActions)
      setGroup(res.group || null)
    } catch (err) {
      if (err.errorFields) return
      message.error(err.message || 'Failed to deactivate form group')
    } finally {
      setDeactivating(false)
    }
  }, [groupIdForActions, deactivateForm, message])

  const handleReactivate = useCallback(async () => {
    if (!groupIdForActions) return
    try {
      setReactivating(true)
      await reactivateFormGroup(groupIdForActions)
      message.success('Form group reactivated')
      const res = await getFormGroup(groupIdForActions)
      setGroup(res.group || null)
    } catch (err) {
      message.error(err.message || 'Failed to reactivate form group')
    } finally {
      setReactivating(false)
    }
  }, [groupIdForActions, message])

  const handleCancelApproval = useCallback(async () => {
    try {
      await cancelApproval(definitionId)
      message.success('Approval cancelled, returned to draft')
      loadDefinition()
    } catch (err) {
      console.error('Failed to cancel approval:', err)
      message.error(err.message || 'Failed to cancel approval')
    }
  }, [definitionId, message, loadDefinition])

  return {
    // state
    loading,
    saving,
    definition,
    form,
    deactivateForm,
    lgus,
    versions,
    group,
    activeTab,
    setActiveTab,
    deactivateModalOpen,
    deactivateReasonTemplate,
    setDeactivateReasonTemplate,
    deactivating,
    retiring,
    reactivating,
    creatingVersion,
    viewOnly,
    groupIdForActions,
    isDeactivated,

    // actions
    loadDefinition,
    handleSave,
    handleSectionsChange,
    handleDownloadsChange,
    handleSubmitForApproval,
    handleRetire,
    handleCreateVersion,
    openDeactivateModal,
    closeDeactivateModal,
    handleDeactivateSubmit,
    handleReactivate,
    handleCancelApproval,
  }
}
