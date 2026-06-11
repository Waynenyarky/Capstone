import { useState } from 'react'
import { Typography, Modal, Input, Alert, Checkbox, App } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { submitRetirement } from '../../../services/retirementService'

const { Text } = Typography
const { TextArea } = Input

export default function RetirementModal({ open, onClose, business, onSuccess }) {
  const { message } = App.useApp()
  const [reason, setReason] = useState('')
  const [grossSales, setGrossSales] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { message.warning('Please provide a reason'); return }
    if (!grossSales || Number(grossSales) < 0) { message.warning('Please provide gross sales for the current year'); return }
    if (!confirmed) { message.warning('Please confirm you understand'); return }
    setSubmitting(true)
    try {
      const businessId = business?.businessId || business?._id
      await submitRetirement(businessId, {
        reason,
        swornStatementGrossSales: Number(grossSales),
      })
      message.success('Retirement request submitted')
      onSuccess?.()
      onClose()
    } catch (err) {
      message.error(err?.message || 'Failed to submit retirement request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGrossSalesChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setGrossSales(val)
  }

  const isFormValid = reason.trim() && grossSales && Number(grossSales) >= 0 && confirmed

  return (
    <Modal
      title="Retire Business"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Submit Retirement Request"
      okButtonProps={{ danger: true, loading: submitting, disabled: !isFormValid }}
      destroyOnHidden
      width={560}
    >
      <Alert
        type="warning"
        showIcon
        message="This action will initiate the retirement process for this business."
        description="Once submitted, this cannot be undone. An LGU Officer will review your request."
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong>Sworn Statement of Gross Sales (Current Year) *</Text>
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
          Enter the total gross sales/receipts for the current year. This is required per RA 7160 Sec. 145 for cessation tax computation.
        </Text>
        <Input
          value={grossSales}
          onChange={handleGrossSalesChange}
          placeholder="Enter gross sales amount"
          addonBefore="₱"
          style={{ marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong>Reason for retirement *</Text>
        <TextArea
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explain why you are retiring this business..."
          maxLength={500}
          showCount
          style={{ marginTop: 8 }}
        />
      </div>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Required Documents"
        description="You may be asked to submit a notarized sworn statement of gross sales, business permit, and other permits during the review process."
        style={{ marginBottom: 16 }}
      />

      <Checkbox checked={confirmed} onChange={e => setConfirmed(e.target.checked)}>
        I understand this action will initiate the retirement process and I declare the gross sales amount above is accurate.
      </Checkbox>
    </Modal>
  )
}
