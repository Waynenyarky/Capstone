import { Modal, Typography } from 'antd'

const { Text } = Typography

export default function ApplicationRejectionReasonModal({ open, onCancel, rejectionReason }) {
  return (
    <Modal
      title="Application Rejection Reason"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{rejectionReason || 'No rejection reason provided.'}</Text>
      </div>
    </Modal>
  )
}
