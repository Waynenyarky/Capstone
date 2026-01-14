import { Alert, Button, Space, Typography } from 'antd'

const { Text } = Typography

export default function TempLoginMfaPrompt({ onSetup }) {
  return (
    <Alert
      type="info"
      showIcon
      message="Secure your account"
      description={
        <Space direction="vertical">
          <Text>Temporary login is complete. You must set up MFA and update your password to finish recovery.</Text>
          <Button type="primary" onClick={onSetup}>
            Set up MFA
          </Button>
        </Space>
      }
    />
  )
}
