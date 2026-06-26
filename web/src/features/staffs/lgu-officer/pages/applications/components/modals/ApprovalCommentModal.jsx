import { Modal } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function ApprovalCommentModal({ open, onClose, reviewComments }) {
  return (
    <Modal
      title="Approval Comment"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{reviewComments || 'No approval comment provided.'}</Text>
      </div>
    </Modal>
  )
}
