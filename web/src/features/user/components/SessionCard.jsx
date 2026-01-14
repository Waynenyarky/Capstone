import { Card, Tag, Space, Button, Typography } from 'antd'
import { invalidateSession } from '@/features/authentication/services/sessionService.js'
import { useNotifier } from '@/shared/notifications.js'

const { Text } = Typography

export default function SessionCard({ session, onInvalidated }) {
  const { success, error } = useNotifier()

  if (!session) return null

  const handleInvalidate = async () => {
    try {
      await invalidateSession(session.id)
      success('Session invalidated')
      onInvalidated?.()
    } catch (err) {
      console.error('invalidate session failed', err)
      error(err, 'Could not invalidate session')
    }
  }

  return (
    <Card size="small" style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Text strong>{session.userAgent || 'Unknown device'}</Text>
          {session.isCurrentSession && <Tag color="blue">Current</Tag>}
          {session.isExpired && <Tag color="red">Expired</Tag>}
        </Space>
        <Text type="secondary">IP: {session.ipAddress || 'unknown'}</Text>
        <Text type="secondary">Last activity: {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleString() : '—'}</Text>
        <Text type="secondary">Expires at: {session.expiresAt ? new Date(session.expiresAt).toLocaleString() : '—'}</Text>
        {!session.isCurrentSession && (
          <Button size="small" danger onClick={handleInvalidate}>
            Invalidate
          </Button>
        )}
      </Space>
    </Card>
  )
}
