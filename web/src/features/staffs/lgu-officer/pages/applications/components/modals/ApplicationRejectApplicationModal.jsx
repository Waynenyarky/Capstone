import { Modal, Space, Input } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function RejectApplicationModal({ open, onClose, onConfirm, rejectReason, setRejectReason }) {
  return (
    <Modal
      title="Reject Application"
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Reject"
      cancelText="Cancel"
    >
      <div style={{ padding: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Text>
            Provide a reason for rejecting this application. The applicant will be notified of the rejection and the reason provided.
          </Text>
          <Input.TextArea
            placeholder="Please specify the rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
        </Space>
      </div>
    </Modal>
  )
}
