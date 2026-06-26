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
      <Text>{message}</Text>
    </Modal>
  )
}
