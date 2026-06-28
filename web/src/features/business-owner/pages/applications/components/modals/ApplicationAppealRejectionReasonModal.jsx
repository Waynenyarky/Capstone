import { Modal, Typography } from 'antd'

const { Text } = Typography

export default function ApplicationAppealRejectionReasonModal({ open, onCancel, reason }) {
  return (
    <Modal
      title="Appeal Rejection Reason"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{reason || 'No appeal rejection reason provided.'}</Text>
      </div>
    </Modal>
  )
}
