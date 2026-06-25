import { useState, useEffect, useCallback } from 'react'
import { Form, Input, Select, Button, Space, Typography, Divider, theme, App, message, Tag } from 'antd'
import { SaveOutlined, InfoCircleOutlined, HistoryOutlined, UndoOutlined, RedoOutlined, RollbackOutlined } from '@ant-design/icons'
import AuditHistoryModal from '@/shared/components/AuditHistoryModal'
import { createFeeGroup, updateFeeGroup, disableFeeGroup, getFeeGroupDraft, saveFeeGroupDraft, publishFeeGroupDraft, getFeeGroupAuditHistory } from '@/features/admin/services/feeService'
import useFeesAutosave from '../hooks/useFeesAutosave'
import useFeesUndoRedo from '../hooks/useFeesUndoRedo'
import { useAdminStepUp } from '@/features/admin/hooks/useAdminStepUp'

const { Text } = Typography
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

export default function FeeGroupDetailPanel({ groupId, group, availableFees, onSave, onDelete, isMobile = false }) {
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
  const selectedFees = Form.useWatch('fees', form)
  const { runWithStepUp, stepUpModal } = useAdminStepUp()

  const isNew = groupId === 'new'

  const initialValues = draft || {
    name: group?.name || '',
    description: group?.description || '',
    fees: group?.fees?.map(f => typeof f === 'object' ? f._id : f) || [],
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
      name: group?.name || '',
      description: group?.description || '',
      fees: group?.fees?.map(f => typeof f === 'object' ? f._id : f) || [],
    }
    form.setFieldsValue(revertValues)
    setFormValues(revertValues)
    setHasChanges(false)
    resetHistory(revertValues)
    message.success('Reverted to original')
  }, [draft, group, form, resetHistory])

  const loadAuditLogs = useCallback(async () => {
    if (isNew) return
    try {
      setAuditLoading(true)
      const logs = await getFeeGroupAuditHistory(groupId, { limit: 20 })
      setAuditLogs(logs)
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }, [groupId, isNew])

  const handleHistoryModalOpen = useCallback(() => {
    loadAuditLogs()
    setHistoryModalOpen(true)
  }, [loadAuditLogs])

  const feeOptions = (availableFees || []).map((fee) => ({
    label: `${fee.name} (₱${fee.amount})`,
    value: fee._id,
  }))

  // Load draft when group changes
  useEffect(() => {
    const loadDraft = async () => {
      if (!isNew && groupId) {
        try {
          const draftData = await getFeeGroupDraft(groupId)
          setDraft(draftData)
          const loadedValues = draftData || {
            name: group?.name || '',
            description: group?.description || '',
            fees: group?.fees?.map(f => typeof f === 'object' ? f._id : f) || [],
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
  }, [groupId, group, isNew, form, resetHistory])

  // Autosave to draft
  const handleAutosave = async (values) => {
    if (isNew) return
    await saveFeeGroupDraft(groupId, values, { requireStepUp: false })
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
        name: group?.name || '',
        description: group?.description || '',
        fees: group?.fees?.map(f => typeof f === 'object' ? f._id : f) || [],
      })
    }
  }, [group?.name, group?.description, group?.fees, form, draft])

  const handleSave = async () => {
    try {
      setSaving(true)
      await form.validateFields()
      const values = form.getFieldsValue()

      if (isNew) {
        await runWithStepUp(async (stepUpToken) => {
          await createFeeGroup(values, { stepUpToken })
        })
        message.success('Fee group created successfully')
      } else {
        // Publish draft to original fee group
        await runWithStepUp(async (stepUpToken) => {
          await publishFeeGroupDraft(groupId, { stepUpToken })
        })
        message.success('Fee group published successfully')
        setDraft(null) // Clear draft after publishing
      }
      onSave()
    } catch (error) {
      if (error?.message !== 'Step-up cancelled') {
        console.error('Failed to save fee group:', error)
        message.error(error.message || 'Failed to save fee group')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleValuesChange = () => {
    const currentValues = form.getFieldsValue()
    setFormValues(currentValues)
    const changed = Object.keys(initialValues).some(
      (key) => JSON.stringify(currentValues[key]) !== JSON.stringify(initialValues[key])
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
          return 'This will activate the fee group and make it available for business permits.'
        case 'disabled':
          return 'This will disable the fee group. It will no longer be available for new business permits.'
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
            await disableFeeGroup(groupId, { requireStepUp: true })
            message.success('Fee group disabled successfully')
            if (onDelete) onDelete()
          } else {
            await updateFeeGroup(groupId, { isActive: true }, { requireStepUp: true })
            message.success('Fee group activated successfully')
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
              {isNew ? 'New Fee Group' : 'Fee Group Detail'}
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
                    value={group?.isActive ? 'active' : 'disabled'}
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
                value={group?.isActive ? 'active' : 'disabled'}
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
            <Input placeholder="Enter fee group name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="fees"
            label="Fees"
            rules={[{ required: true, message: 'At least one fee is required' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select fees"
              options={feeOptions}
              style={{ width: '100%' }}
              tagRender={(props) => {
                const { value, onClose } = props
                const fee = (availableFees || []).find(f => f && f._id === value)
                if (!fee) return null
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: token.borderRadius,
                      padding: '2px 8px',
                      margin: '2px',
                      fontSize: 12,
                    }}
                  >
                    {fee.name} (₱{fee.amount})
                    <span
                      onClick={onClose}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onClose()
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label="Remove"
                      style={{ marginLeft: 6, cursor: 'pointer', color: token.colorTextSecondary }}
                    >
                      ×
                    </span>
                  </span>
                )
              }}
            />
          </Form.Item>

          <Divider />

          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Total Amount</Text>
            <div>
              <Text strong>
                ₱{selectedFees?.reduce((sum, feeId) => {
                  const fee = (availableFees || []).find(f => f && f._id === feeId)
                  return sum + (fee?.amount || 0)
                }, 0).toFixed(2) || '0.00'}
              </Text>
            </div>
          </div>
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
