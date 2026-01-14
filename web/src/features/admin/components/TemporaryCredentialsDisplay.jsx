import { Alert, Button, Descriptions, Space, Typography } from 'antd'

const { Text } = Typography

export default function TemporaryCredentialsDisplay({ credentials, onClose }) {
  if (!credentials) return null

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        type="success"
        showIcon
        message="Temporary credentials generated"
        description="Share the username and temporary password securely with the staff member."
      />
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Username">{credentials.username}</Descriptions.Item>
        {credentials.devTempPassword && (
          <Descriptions.Item label="Temporary Password">
            <Text code>{credentials.devTempPassword}</Text>
            <Text type="secondary" style={{ display: 'block' }}>Visible in non-production only</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Expires At">{credentials.expiresAt ? new Date(credentials.expiresAt).toLocaleString() : 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Expires After First Login">{credentials.expiresAfterFirstLogin ? 'Yes' : 'No'}</Descriptions.Item>
      </Descriptions>
      <Button type="primary" onClick={onClose} block>
        Done
      </Button>
    </Space>
  )
}
