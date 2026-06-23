import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Space, Typography, Divider, theme, Modal, message } from 'antd'
import { SaveOutlined, InfoCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import AuditHistoryModal from '@/shared/components/AuditHistoryModal'
import { createFeeGroup, updateFeeGroup, disableFeeGroup } from '@/features/admin/services/feeService'

const { Text } = Typography
const { TextArea } = Input

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

export default function FeeGroupDetailPanel({ groupId, group, availableFees, onSave, onDelete }) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const selectedFees = Form.useWatch('fees', form)

  const isNew = groupId === 'new'

  const feeOptions = (availableFees || []).map((fee) => ({
    label: `${fee.name} (₱${fee.amount})`,
    value: fee._id,
  }))

  const initialValues = {
    name: group?.name || '',
    description: group?.description || '',
    fees: group?.fees?.map(f => typeof f === 'object' ? f._id : f) || [],
  }

  useEffect(() => {
    form.setFieldsValue(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.name, group?.description, group?.fees, form])

  const handleSave = async () => {
    try {
      setSaving(true)
      await form.validateFields()
      const values = form.getFieldsValue()
      
      if (isNew) {
        await createFeeGroup(values, { requireStepUp: true })
        message.success('Fee group created successfully')
      } else {
        await updateFeeGroup(groupId, values, { requireStepUp: true })
        message.success('Fee group updated successfully')
      }
      
      setHasChanges(false)
      if (onSave) onSave()
    } catch (error) {
      console.error('Failed to save fee group:', error)
      message.error(error.message || 'Failed to save fee group')
    } finally {
      setSaving(false)
    }
  }

  const handleValuesChange = () => {
    const currentValues = form.getFieldsValue()
    const changed = Object.keys(initialValues).some(
      (key) => JSON.stringify(currentValues[key]) !== JSON.stringify(initialValues[key])
    )
    setHasChanges(changed)
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

    Modal.confirm({
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
                  value={group?.isActive ? 'active' : 'disabled'}
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
                const fee = (availableFees || []).find(f => f._id === value)
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
                    {fee?.name} (₱{fee?.amount})
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
                  const fee = (availableFees || []).find(f => f._id === feeId)
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
        auditLogs={[]}
      />
    </div>
  )
}
