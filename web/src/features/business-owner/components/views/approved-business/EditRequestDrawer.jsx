import { useState } from 'react'
import { Typography, Drawer, Select, Input, Button, App } from 'antd'
import { submitEditRequest } from '../../../services/editRequestsService'

const { Text } = Typography
const { TextArea } = Input

export default function EditRequestDrawer({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [selectedFields, setSelectedFields] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const editableFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'registeredBusinessName', label: 'Registered Business Name' },
    { value: 'tradeName', label: 'Trade Name' },
    { value: 'address', label: 'Business Address' },
    { value: 'contact', label: 'Contact Information' },
    { value: 'phoneNumber', label: 'Phone Number' },
    { value: 'email', label: 'Email' },
    { value: 'businessActivities', label: 'Business Activities' },
    { value: 'capital', label: 'Capital' },
  ]

  const handleSubmit = async () => {
    if (!selectedFields.length) { message.warning('Select at least one field'); return }
    if (!reason.trim()) { message.warning('Please provide a reason'); return }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      const results = await Promise.all(
        selectedFields.map(f =>
          submitEditRequest({
            businessId,
            fieldName: f,
            currentValue: String(business?.[f] || ''),
            requestedValue: fieldValues[f] || '',
            reason,
          })
        )
      )
      message.success(`${results.length} edit request${results.length > 1 ? 's' : ''} submitted`)
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit edit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title="Request Edit"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!selectedFields.length || !reason.trim()}>
          Submit Request
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Text strong>Fields to edit</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select fields"
            options={editableFields}
            value={selectedFields}
            onChange={setSelectedFields}
          />
        </div>
        {selectedFields.map(field => (
          <div key={field}>
            <Text type="secondary" style={{ fontSize: 12 }}>{editableFields.find(f => f.value === field)?.label}: {String(business?.[field] || 'N/A')}</Text>
            <Input
              placeholder={`New ${editableFields.find(f => f.value === field)?.label}`}
              value={fieldValues[field] || ''}
              onChange={e => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
              style={{ marginTop: 4 }}
            />
          </div>
        ))}
        <div>
          <Text strong>Reason for edit *</Text>
          <TextArea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why these changes are needed..."
            style={{ marginTop: 8 }}
          />
        </div>
      </div>
    </Drawer>
  )
}
