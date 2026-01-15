import { Card, Typography } from 'antd'
import DeletionCountdown from './DeletionCountdown.jsx'

const { Text } = Typography

export default function DeletionScheduledInfo({ scheduledAt, requestedAt }) {
  return (
    <Card size="small" title="Deletion Schedule" style={{ marginBottom: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Text>Requested: {requestedAt ? new Date(requestedAt).toLocaleString() : '—'}</Text>
        <Text strong>Scheduled: {scheduledAt ? new Date(scheduledAt).toLocaleString() : '—'}</Text>
        <DeletionCountdown target={scheduledAt} />
      </div>
    </Card>
  )
}
