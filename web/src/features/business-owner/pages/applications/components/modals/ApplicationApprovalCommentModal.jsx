import { Modal, Typography } from 'antd'

const { Text } = Typography

export default function ApplicationApprovalCommentModal({ open, onCancel, comment }) {
  return (
    <Modal
      title="Approval Comment"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ padding: 16 }}>
        <Text>{comment || 'No approval comment provided.'}</Text>
      </div>
    </Modal>
  )
}
