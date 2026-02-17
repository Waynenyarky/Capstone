import { Modal, Typography } from 'antd'

const { Text } = Typography

export default function SessionTimeoutWarning({ open, onStay }) {
  return (
    <Modal
      open={open}
      onOk={onStay}
      onCancel={onStay}
      okText="Stay Logged In"
      cancelButtonProps={{ style: { display: 'none' } }}
      title="Session expiring soon"
    >
      <Text>Your session is about to expire due to inactivity. Stay logged in to continue.</Text>
    </Modal>
  )
}
