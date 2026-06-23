import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Button, Space, Typography, theme, Modal, Select, message } from 'antd'
import { SaveOutlined, InfoCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import AuditHistoryModal from '@/shared/components/AuditHistoryModal'
import { createPenaltyRule, updatePenaltyRule, disablePenaltyRule } from '@/features/admin/services/feeService'

const { Text } = Typography
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

export default function PenaltyRuleDetailPanel({ ruleId, rule, onSave, onDelete }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const isNew = ruleId === 'new'

  const initialValues = {
    name: rule?.name || '',
    description: rule?.description || '',
    amount: rule?.amount || 0,
  }

  useEffect(() => {
    form.setFieldsValue(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule?.name, rule?.description, rule?.amount, form])

  const handleSave = async () => {
    try {
      setSaving(true)
      await form.validateFields()
      const values = form.getFieldsValue()
      
      if (isNew) {
        await createPenaltyRule(values, { requireStepUp: true })
        message.success('Penalty rule created successfully')
      } else {
        await updatePenaltyRule(ruleId, values, { requireStepUp: true })
        message.success('Penalty rule updated successfully')
      }
      
      setHasChanges(false)
      if (onSave) onSave()
    } catch (error) {
      console.error('Failed to save penalty rule:', error)
      message.error(error.message || 'Failed to save penalty rule')
    } finally {
      setSaving(false)
    }
  }

  const handleValuesChange = () => {
    const currentValues = form.getFieldsValue()
    const changed = Object.keys(initialValues).some(
      (key) => currentValues[key] !== initialValues[key]
    )
    setHasChanges(changed)
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

    Modal.confirm({
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!hasChanges && !isNew}>
              Publish Changes
            </Button>
            {!isNew && (
              <>
                <div style={{ width: 1, height: 24, background: token.colorBorderSecondary, margin: '0 8px' }} />
                <Space.Compact>
                  <Button icon={<InfoCircleOutlined />} disabled />
                  <Button icon={<HistoryOutlined />} onClick={() => setHistoryModalOpen(true)} />
                </Space.Compact>
              </>
            )}
          </Space>
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
        </div>
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
        auditLogs={[]}
      />
    </div>
  )
}
