import { Modal, Typography } from 'antd'

const { Text } = Typography

export default function ResubmitConfirmationModal({ open, onCancel, onConfirm, loading = false }) {
  return (
    <Modal
      title="Confirm Resubmission"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Yes, Resubmit"
      cancelText="Cancel"
      confirmLoading={loading}
      destroyOnClose
    >
      <div>
        <Text>Are you sure you want to resubmit your application?</Text>
        <div style={{ marginTop: 16 }}>
          <Text type="danger" style={{ fontWeight: 500 }}>
            Important: You can only resubmit once. Please ensure all requested changes are complete and final before proceeding.
          </Text>
        </div>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">This will send your updated information back to the LGU for review.</Text>
        </div>
      </div>
    </Modal>
  )
}
