import { Alert, Typography } from 'antd'

const { Text } = Typography

/**
 * Banner shown during recovery when the backend flags unusual activity
 */
export default function RecoverySuspiciousActivityAlert({ ipAddress, locationHint, warning }) {
  const message = warning || 'We noticed unusual activity on this recovery request.'
  const descParts = []
  if (ipAddress) descParts.push(`IP: ${ipAddress}`)
  if (locationHint) descParts.push(`Location: ${locationHint}`)
  const description = descParts.length > 0 ? <Text>{descParts.join(' • ')}</Text> : null

  return (
    <Alert
      showIcon
      type="warning"
      message={message}
      description={description}
      style={{ marginBottom: 16 }}
    />
  )
}
