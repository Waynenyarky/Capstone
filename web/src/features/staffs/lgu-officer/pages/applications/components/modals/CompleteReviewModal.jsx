import { Modal, Space, Input } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function CompleteReviewModal({ open, onClose, onConfirm, completeReviewComment, setCompleteReviewComment }) {
  return (
    <Modal
      title="Complete Review"
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Complete"
      cancelText="Cancel"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Text>
          Complete your review of this application. You may add optional comments for your records.
        </Text>
        <Input.TextArea
          placeholder="Add any comments about this review..."
          value={completeReviewComment}
          onChange={(e) => setCompleteReviewComment(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>
  )
}
