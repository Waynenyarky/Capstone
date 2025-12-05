import { Card, Typography, Flex, Button } from 'antd'
import { useLogoutForm } from "@/features/authentication/hooks"
import ConfirmLogoutModal from './ConfirmLogoutModal.jsx'
import { useConfirmLogoutModal } from "@/features/authentication/hooks"

export default function LogoutForm() {
  const { name, role, handleLogout } = useLogoutForm()
  const { open, show, hide, confirming, handleConfirm } = useConfirmLogoutModal({ onConfirm: handleLogout })
  return (
    <Card size="small" title="Session">
      <Typography.Text>
        {name} ({role})
      </Typography.Text>
      <Flex justify="end" gap="small">
        <Button type="primary" onClick={show}>Log out</Button>
      </Flex>
      <ConfirmLogoutModal open={open} onConfirm={handleConfirm} onCancel={hide} confirmLoading={confirming} />
    </Card>
  )
}