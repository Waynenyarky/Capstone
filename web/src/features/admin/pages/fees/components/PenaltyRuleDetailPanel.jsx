import { useState, useEffect, useCallback } from 'react'
import { Form, Input, InputNumber, Button, Space, Typography, theme, App, Select, message, Tag } from 'antd'
import { SaveOutlined, InfoCircleOutlined, HistoryOutlined, UndoOutlined, RedoOutlined, RollbackOutlined } from '@ant-design/icons'
import AuditHistoryModal from '@/shared/components/AuditHistoryModal'
import { createPenaltyRule, updatePenaltyRule, disablePenaltyRule, getPenaltyRuleDraft, savePenaltyRuleDraft, publishPenaltyRuleDraft, getPenaltyRuleAuditHistory } from '@/features/admin/services/feeService'
import useFeesAutosave from '../hooks/useFeesAutosave'
import useFeesUndoRedo from '../hooks/useFeesUndoRedo'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

const { Text } = Typography
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

export default function PenaltyRuleDetailPanel({ ruleId, rule, onSave, onDelete, isMobile = false }) {
  const { token } = theme.useToken()
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [draft, setDraft] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const isNew = ruleId === 'new'

  const initialValues = draft || {
    name: rule?.name || '',
    description: rule?.description || '',
    amount: rule?.amount || 0,
  }

  const { undo, redo, pushHistory, resetHistory, canUndo, canRedo } = useFeesUndoRedo()

  const handleUndo = useCallback(() => {
    const entry = undo()
    if (entry) {
      form.setFieldsValue(entry)
      setFormValues(entry)
    }
  }, [form, undo])

  const handleRedo = useCallback(() => {
    const entry = redo()
    if (entry) {
      form.setFieldsValue(entry)
      setFormValues(entry)
    }
  }, [form, redo])

  const handleRevert = useCallback(() => {
    const revertValues = draft || {
      name: rule?.name || '',
      description: rule?.description || '',
      amount: rule?.amount || 0,
    }
    form.setFieldsValue(revertValues)
    setFormValues(revertValues)
    setHasChanges(false)
    resetHistory(revertValues)
    message.success('Reverted to original')
  }, [draft, rule, form, resetHistory])

  const loadAuditLogs = useCallback(async () => {
    if (isNew) return
    try {
      setAuditLoading(true)
      const logs = await getPenaltyRuleAuditHistory(ruleId, { limit: 20 })
      setAuditLogs(logs)
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }, [ruleId, isNew])

  const handleHistoryModalOpen = useCallback(() => {
    loadAuditLogs()
    setHistoryModalOpen(true)
  }, [loadAuditLogs])

  // Load draft when rule changes
  useEffect(() => {
    const loadDraft = async () => {
      if (!isNew && ruleId) {
        try {
          const draftData = await getPenaltyRuleDraft(ruleId)
          setDraft(draftData)
          const loadedValues = draftData || {
            name: rule?.name || '',
            description: rule?.description || '',
            amount: rule?.amount || 0,
          }
          form.setFieldsValue(loadedValues)
          setFormValues(loadedValues)
          resetHistory(loadedValues)
        } catch (err) {
          console.error('Failed to load draft:', err)
        }
      }
    }
    loadDraft()
  }, [ruleId, rule, isNew, form, resetHistory])

  // Autosave to draft
  const handleAutosave = async (values) => {
    if (isNew) return
    await savePenaltyRuleDraft(ruleId, values, { requireStepUp: false })
  }

  useFeesAutosave(
    isNew ? null : formValues,
    handleAutosave,
    !isNew,
    hasChanges
  )

  useEffect(() => {
    if (!draft) {
      form.setFieldsValue({
        name: rule?.name || '',
        description: rule?.description || '',
        amount: rule?.amount || 0,
      })
    }
  }, [rule?.name, rule?.description, rule?.amount, form, draft])

  const handleSave = async () => {
    try {
      setSaving(true)
      await form.validateFields()
      const values = form.getFieldsValue()

      if (isNew) {
        await runWithStepUp(async (stepUpToken) => {
          await createPenaltyRule(values, { stepUpToken })
        })
        message.success('Penalty rule created successfully')
      } else {
        // Publish draft to original penalty rule
        await runWithStepUp(async (stepUpToken) => {
          await publishPenaltyRuleDraft(ruleId, { stepUpToken })
        })
        message.success('Penalty rule published successfully')
        setDraft(null) // Clear draft after publishing
      }
      onSave()
    } catch (error) {
      if (error?.message !== 'Step-up cancelled') {
        console.error('Failed to save penalty rule:', error)
        message.error(error.message || 'Failed to save penalty rule')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleValuesChange = () => {
    const currentValues = form.getFieldsValue()
    setFormValues(currentValues)
    const changed = Object.keys(initialValues).some(
      (key) => currentValues[key] !== initialValues[key]
    )
    setHasChanges(changed)
    if (changed) {
      pushHistory(currentValues)
    }
  }

  const handleStatusChange = async (status) => {
    const newStatusLabel = status === 'active' ? 'Active' : 'Disabled'

    const getStatusMessage = (newStatus) => {
      switch (newStatus) {
        case 'active':
          return 'This will activate the penalty rule and make it available for business permits.'
        case 'disabled':
          return 'This will disable the penalty rule. It will no longer be available for new business permits.'
        default:
          return `Are you sure you want to change the status to ${newStatusLabel}?`
      }
    }

    modal.confirm({
      title: 'Change Status',
      content: getStatusMessage(status),
      okText: 'Change',
      cancelText: 'Cancel',
      onOk: async () => {
        setUpdatingStatus(true)
        try {
          if (status === 'disabled') {
            await disablePenaltyRule(ruleId, { requireStepUp: true })
            message.success('Penalty rule disabled successfully')
            if (onDelete) onDelete()
          } else {
            await updatePenaltyRule(ruleId, { isActive: true }, { requireStepUp: true })
            message.success('Penalty rule activated successfully')
            if (onSave) onSave()
          }
        } catch (error) {
          console.error('Failed to update status:', error)
          message.error(error.message || 'Failed to update status')
        } finally {
          setUpdatingStatus(false)
        }
      },
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {isNew ? 'New Penalty Rule' : 'Penalty Rule Detail'}
            </Text>
            {!isNew && (
              <Tag color={draft ? 'blue' : hasChanges ? 'warning' : 'success'} style={{ fontWeight: 'normal' }}>
                {draft ? 'Draft' : hasChanges ? 'Unsaved' : 'Published'}
              </Tag>
            )}
          </Space>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0 }}>
          <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!hasChanges && !isNew} style={{ flex: isMobile ? 1 : 'auto' }}>
              Publish Changes
            </Button>
            {!isNew && (
              <>
                <Space.Compact>
                  <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={!canUndo} />
                  <Button icon={<RedoOutlined />} onClick={handleRedo} disabled={!canRedo} />
                  <Button icon={<RollbackOutlined />} onClick={handleRevert} />
                </Space.Compact>
                <Space.Compact>
                  <Button icon={<InfoCircleOutlined />} disabled />
                  <Button icon={<HistoryOutlined />} onClick={handleHistoryModalOpen} />
                </Space.Compact>
              </>
            )}
          </div>
          {!isMobile && (
            <Space>
              {!isNew && (
                <Form.Item label="Status" style={{ marginBottom: 0 }}>
                  <Select
                    value={rule?.isActive ? 'active' : 'disabled'}
                    onChange={handleStatusChange}
                    loading={updatingStatus}
                    style={{ width: 120 }}
                    options={STATUS_OPTIONS}
                  />
                </Form.Item>
              )}
            </Space>
          )}
        </div>
        {isMobile && !isNew && (
          <div style={{ marginTop: 12 }}>
            <Form.Item label="Status" style={{ marginBottom: 0 }}>
              <Select
                value={rule?.isActive ? 'active' : 'disabled'}
                onChange={handleStatusChange}
                loading={updatingStatus}
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
              />
            </Form.Item>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Enter penalty rule name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (₱)"
            rules={[{ required: true, message: 'Amount is required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="Enter amount"
            />
          </Form.Item>
        </Form>
      </div>

      <AuditHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        auditLogs={auditLogs}
        loading={auditLoading}
      />
      {stepUpModal}
    </div>
  )
}
