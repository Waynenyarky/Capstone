import { Alert, Button, Space } from 'antd'

export default function UndoDeletionBanner({ onUndo, expiresAt }) {
  const countdown = expiresAt ? `You can undo before ${new Date(expiresAt).toLocaleString()}.` : ''
  return (
    <Alert
      type="warning"
      showIcon
      message="Account deletion scheduled"
      description={
        <Space direction="vertical">
          <span>{countdown || 'You can undo while the grace period is active.'}</span>
          <Button type="primary" onClick={onUndo}>Undo Deletion</Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
