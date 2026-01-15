import { Modal } from 'antd'

export default function ConfirmLogoutModal({
  open,
  onConfirm,
  onCancel,
  confirmLoading = false,
  title = 'Confirm Logout',
  content = 'Are you sure you want to log out?',
  okText = 'Log out',
  cancelText = 'Cancel',
}) {
  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      centered
      destroyOnHidden
    >
      <div>{content}</div>
    </Modal>
  )
}