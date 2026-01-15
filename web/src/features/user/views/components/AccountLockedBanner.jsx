import { Alert, Button } from 'antd'

export default function AccountLockedBanner({ remainingMinutes, onSupport }) {
  const minutes = Number.isFinite(remainingMinutes) ? Math.max(0, Math.round(remainingMinutes)) : null
  const desc = minutes !== null ? `Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` : 'Try again later.'
  return (
    <Alert
      type="error"
      showIcon
      message="Account locked"
      description={
        <div>
          <div>{desc}</div>
          {onSupport && <Button size="small" style={{ marginTop: 8 }} onClick={onSupport}>Contact support</Button>}
        </div>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
