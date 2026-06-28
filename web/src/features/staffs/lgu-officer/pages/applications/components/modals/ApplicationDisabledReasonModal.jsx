import { Modal, Button } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function DisabledReasonModal({ open, onClose, message }) {
  return (
    <Modal
      title="Action Not Available"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ padding: 16 }}>
        <Text>{message}</Text>
      </div>
    </Modal>
  )
}
