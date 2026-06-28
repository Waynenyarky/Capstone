import { Modal, Space, Input } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function RejectAppealModal({ open, onClose, onConfirm, rejectAppealReason, setRejectAppealReason }) {
  return (
    <Modal
      title="Reject Appeal"
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Reject Appeal"
      cancelText="Cancel"
    >
      <div style={{ padding: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text>
            Provide a reason for rejecting this appeal. The applicant will be notified of the appeal rejection and the reason provided.
          </Text>
          <Input.TextArea
            placeholder="Please specify the appeal rejection reason"
            value={rejectAppealReason}
            onChange={(e) => setRejectAppealReason(e.target.value)}
            rows={4}
          />
        </Space>
      </div>
    </Modal>
  )
}
