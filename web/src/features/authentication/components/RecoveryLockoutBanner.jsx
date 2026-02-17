import { Alert } from 'antd'

/**
 * Displays lockout info during recovery if the account is temporarily locked.
 */
export default function RecoveryLockoutBanner({ remainingMinutes }) {
  const minutes = Number.isFinite(remainingMinutes) ? Math.max(0, Math.round(remainingMinutes)) : null
  const description = minutes !== null
    ? `Too many attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`
    : 'Too many attempts. Try again later.'

  return (
    <Alert
      showIcon
      type="error"
      message="Account temporarily locked"
      description={description}
      style={{ marginBottom: 16 }}
    />
  )
}
