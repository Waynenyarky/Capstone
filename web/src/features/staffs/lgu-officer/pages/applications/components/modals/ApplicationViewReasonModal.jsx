import { Modal, Drawer, Button } from 'antd'
import { Typography } from 'antd'

const { Text } = Typography

export default function ViewReasonModal({ open, onClose, pendingAction, isMobile }) {
  const content = pendingAction?.payload?.rejectionReason || pendingAction?.payload?.comments || pendingAction?.payload?.requestOther || 'No reason provided'

  if (isMobile) {
    return (
      <Drawer
        title="Reason"
        open={open}
        onClose={onClose}
        width="75%"
      >
        <Text>{content}</Text>
      </Drawer>
    )
  }

  return (
    <Modal
      title="Reason"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ padding: 16 }}>
        <Text>{content}</Text>
      </div>
    </Modal>
  )
}
