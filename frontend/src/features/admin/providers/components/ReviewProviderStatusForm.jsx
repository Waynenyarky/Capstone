import { Card, Descriptions, Typography, Button, Spin, Flex, Modal, Form, Select, Input, Divider } from 'antd'
import { useState } from 'react'
import { useReviewProviderStatusForm } from "@/features/admin/providers/hooks/useReviewProviderStatusForm.js"
import { PROVIDER_STATUS_OPTIONS, PROVIDER_STATUS, getProviderStatusLabel } from "@/features/admin/providers/constants/providerStatus.js"

export default function ReviewProviderStatusForm({ providerId, onReviewed }) {
  const { provider, isLoading, isSaving, updateStatus, reload, resolveAppeal } = useReviewProviderStatusForm(providerId)
  const [modalOpen, setModalOpen] = useState(false)
  const [appealModal, setAppealModal] = useState({ open: false, appealId: null, decision: 'approved' })
  const [form] = Form.useForm()
  const [appealForm] = Form.useForm()

  const canAct = !!providerId && !!provider && !isLoading

  const openChangeStatus = () => {
    if (!provider) return
    setModalOpen(true)
    const initial = [PROVIDER_STATUS.ACTIVE, PROVIDER_STATUS.INACTIVE].includes(provider.status)
      ? provider.status
      : PROVIDER_STATUS.INACTIVE
    form.setFieldsValue({ nextStatus: initial, reason: '' })
  }

  if (!providerId) {
    return (
      <Card>
        <Typography.Text type="secondary">Select a provider to review their status.</Typography.Text>
      </Card>
    )
  }

  return (
    <Card title="Review Provider Status">
      {isLoading && <Spin />}
      {!isLoading && provider && (
        <>
          <Descriptions variant="outlined" column={1} size="small">
            <Descriptions.Item label="Name">{provider.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{provider.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Business Name">{provider.businessName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Current Status">{getProviderStatusLabel(provider.status) || '-'}</Descriptions.Item>
            <Descriptions.Item label="Application Status">{provider.applicationStatus || '-'}</Descriptions.Item>
            {provider.rejectionReason && (
              <Descriptions.Item label="Rejection Reason">{provider.rejectionReason}</Descriptions.Item>
            )}
            {provider.reviewedAt && (
              <Descriptions.Item label="Reviewed At">{new Date(provider.reviewedAt).toLocaleString()}</Descriptions.Item>
            )}
            {provider.reviewedByEmail && (
              <Descriptions.Item label="Reviewed By">{provider.reviewedByEmail}</Descriptions.Item>
            )}
            <Descriptions.Item label="ID">{provider.id || '-'}</Descriptions.Item>
          </Descriptions>
          <Divider orientation="left" style={{ marginTop: 12, marginBottom: 12 }}>Status Change History</Divider>
          {Array.isArray(provider.accountStatusHistory) && provider.accountStatusHistory.length > 0 ? (
            <div>
              {[...provider.accountStatusHistory]
                .sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0))
                .slice(0, 5)
                .map((e, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <Typography.Text strong>{getProviderStatusLabel(e.status)}</Typography.Text>{' '}
                    <Typography.Text>- {e.reason || '-'}</Typography.Text>
                    <div>
                      <Typography.Text type="secondary">
                        {new Date(e.changedAt).toLocaleString()} {e.changedByEmail ? `by ${e.changedByEmail}` : ''}
                      </Typography.Text>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <Typography.Text type="secondary">No status changes recorded yet.</Typography.Text>
          )}

          <Divider orientation="left" style={{ marginTop: 12, marginBottom: 12 }}>Appeals</Divider>
          {Array.isArray(provider.accountAppeals) && provider.accountAppeals.length > 0 ? (
            <div>
              {[...provider.accountAppeals]
                .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
                .map((ap) => (
                  <div key={String(ap._id)} style={{ marginBottom: 12 }}>
                    <Typography.Text>{ap.appealReason || '-'}</Typography.Text>
                    <div>
                      <Typography.Text type="secondary">
                        {new Date(ap.submittedAt).toLocaleString()} — Status: {ap.status}
                        {ap.submittedByEmail ? `; by ${ap.submittedByEmail}` : ''}
                        {ap.decidedAt ? `; decided ${new Date(ap.decidedAt).toLocaleString()} by ${ap.decidedByEmail || '-'}` : ''}
                      </Typography.Text>
                    </div>
                    {ap.decisionNotes && (
                      <Typography.Text type="secondary">Decision Notes: {ap.decisionNotes}</Typography.Text>
                    )}
                    {ap.status === 'pending' && (
                      <Flex justify="end" gap="small" style={{ marginTop: 8 }}>
                        <Button onClick={() => { setAppealModal({ open: true, appealId: ap._id, decision: 'approved' }); appealForm.setFieldsValue({ decision: 'approved', decisionNotes: '' }) }}>Approve Appeal</Button>
                        <Button danger onClick={() => { setAppealModal({ open: true, appealId: ap._id, decision: 'denied' }); appealForm.setFieldsValue({ decision: 'denied', decisionNotes: '' }) }}>Deny Appeal</Button>
                      </Flex>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <Typography.Text type="secondary">No appeals submitted.</Typography.Text>
          )}
          <Flex justify="end" gap="small" style={{ marginTop: 24 }}>
            <Button onClick={reload} disabled={isLoading}>Reload</Button>
            <Button type="primary" onClick={openChangeStatus} disabled={!canAct}>Change Status</Button>
          </Flex>
        </>
      )}

      <Modal
        title="Change Provider Status"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okText="Update Status"
        confirmLoading={isSaving}
        onOk={async () => {
          try {
            const values = await form.validateFields()
            const next = values?.nextStatus
            const reason = values?.reason || ''
            const updated = await updateStatus(next, reason)
            if (updated) {
              setModalOpen(false)
              form.resetFields()
              if (typeof onReviewed === 'function') onReviewed(updated)
            }
          } catch (err) { void err }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nextStatus"
            label="New Status"
            rules={[{ required: true, message: 'Please select a new status' }]}
          >
            <Select options={PROVIDER_STATUS_OPTIONS.filter((opt) => [PROVIDER_STATUS.ACTIVE, PROVIDER_STATUS.INACTIVE].includes(opt.value))} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason (required)"
            rules={[{ required: true, message: 'Please provide a reason for this status change' }]}
          >
            <Input.TextArea rows={4} placeholder="Explain why this provider's status is being changed" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Resolve Appeal"
        open={appealModal.open}
        onCancel={() => setAppealModal({ open: false, appealId: null, decision: 'approved' })}
        okText="Resolve"
        confirmLoading={isSaving}
        onOk={async () => {
          try {
            const values = await appealForm.validateFields()
            const decision = values?.decision
            const notes = values?.decisionNotes || ''
            const updated = await resolveAppeal(appealModal.appealId, decision, notes)
            if (updated) {
              setAppealModal({ open: false, appealId: null, decision: 'approved' })
              appealForm.resetFields()
              if (typeof onReviewed === 'function') onReviewed(updated)
            }
          } catch (err) { void err }
        }}
      >
        <Form form={appealForm} layout="vertical">
          <Form.Item name="decision" label="Decision" rules={[{ required: true, message: 'Select a decision' }]}>
            <Select options={[{ value: 'approved', label: 'Approve Appeal' }, { value: 'denied', label: 'Deny Appeal' }]} />
          </Form.Item>
          <Form.Item name="decisionNotes" label="Decision Notes" rules={[{ required: true, message: 'Provide decision notes' }]}>
            <Input.TextArea rows={4} placeholder="Notes that justify this decision" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}