import { Modal } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function AppealRejectionReasonModal({ open, onClose, appealResolution }) {
  return (
    <Modal
      title="Appeal Rejection Reason"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{appealResolution || 'No appeal rejection reason provided.'}</Text>
      </div>
    </Modal>
  )
}
