import React from 'react'
import { Modal, Form, Input, Button, Space, Alert, Spin } from 'antd'
import { getRenewalStatusTag } from '../constants/statusConfig.jsx'

export default function EditRenewalModal({
  open,
  onCancel,
  modalData,
  selectedRecord,
  loading,
  form,
  canEdit,
  onSave
}) {
  return (
    <Modal
      title="Edit Business Renewal"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      {loading && !modalData ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : (
      <>
      {selectedRecord && !canEdit(selectedRecord, 'renewal') && (
        <Alert
          message="Editing Not Allowed"
          description="This renewal cannot be edited because it has been submitted or approved. Only draft renewals can be edited."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical" disabled={!selectedRecord || !canEdit(selectedRecord, 'renewal')}>
        <Form.Item label="Business Name">
          <Input value={modalData?.businessName} disabled />
        </Form.Item>
        <Form.Item label="Business ID">
          <Input value={modalData?.businessId} disabled />
        </Form.Item>
        <Form.Item label="Renewal ID">
          <Input value={modalData?.renewalId} disabled />
        </Form.Item>
        <Form.Item label="Reference Number">
          <Input value={modalData?.referenceNumber || 'N/A'} disabled />
        </Form.Item>
        <Form.Item label="Renewal Year">
          <Input value={modalData?.renewalYear || 'N/A'} disabled />
        </Form.Item>
        <Form.Item label="Renewal Status">
          {getRenewalStatusTag(modalData?.renewalStatus)}
        </Form.Item>
        <Form.Item
          label={modalData?.renewalYear ? `Gross receipts for ${(modalData.renewalYear || new Date().getFullYear()) - 1} (₱)` : 'Gross Receipts (₱)'}
          name="grossReceipts"
          rules={[{ required: true, message: 'Please enter gross receipts' }]}
        >
          <Input type="number" min={0} placeholder="Enter gross receipts amount" />
        </Form.Item>
      </Form>
      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={onCancel}>Cancel</Button>
        {selectedRecord && canEdit(selectedRecord, 'renewal') && (
          <Button type="primary" onClick={onSave} loading={loading}>
            Save Changes
          </Button>
        )}
      </Space>
      </>
      )}
    </Modal>
  )
}
