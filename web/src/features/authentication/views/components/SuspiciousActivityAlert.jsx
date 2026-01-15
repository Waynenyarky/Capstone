import { Alert } from 'antd'

export default function SuspiciousActivityAlert({ message, details }) {
  return (
    <Alert
      showIcon
      type="warning"
      message={message || 'We detected unusual activity on your account.'}
      description={details}
      style={{ marginBottom: 16 }}
    />
  )
}
