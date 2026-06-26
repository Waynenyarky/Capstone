import { Modal } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function ApplicationRejectionReasonModal({ open, onClose, rejectionReason }) {
  return (
    <Modal
      title="Application Rejection Reason"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{rejectionReason || 'No rejection reason provided.'}</Text>
      </div>
    </Modal>
  )
}
