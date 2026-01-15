import React, { useEffect, useState } from 'react'
import { Card, List, Button, Space, Typography } from 'antd'
import SessionCard from './SessionCard.jsx'
import InvalidateSessionsButton from './InvalidateSessionsButton.jsx'
import { getActiveSessions } from '@/features/authentication/services/sessionService.js'
import { useNotifier } from '@/shared/notifications.js'

const { Text } = Typography

export default function ActiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const { error } = useNotifier()

  const load = async () => {
    try {
      setLoading(true)
      const res = await getActiveSessions()
      setSessions(res?.sessions || [])
    } catch (err) {
      console.error('load sessions failed', err)
      error(err, 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show maximum 2 sessions before making it scrollable
  // Each SessionCard is approximately 160-180px tall, so 2 sessions ≈ 360px
  const maxHeight = sessions.length > 2 ? '360px' : 'auto'
  const shouldScroll = sessions.length > 2

  return (
    <Card
      title="Active Sessions"
      extra={<Button size="small" onClick={load} loading={loading}>Refresh</Button>}
    >
      <InvalidateSessionsButton onDone={load} />
      <div
        style={{
          maxHeight: maxHeight,
          overflowY: shouldScroll ? 'auto' : 'visible',
          overflowX: 'hidden',
          paddingRight: shouldScroll ? '8px' : '0',
          scrollBehavior: 'smooth',
        }}
        className={shouldScroll ? 'active-sessions-scrollable' : ''}
      >
        <List
          loading={loading}
          dataSource={sessions}
          locale={{ emptyText: 'No active sessions' }}
          renderItem={(session) => (
            <List.Item style={{ paddingBottom: 12 }}>
              <SessionCard session={session} onInvalidated={load} />
            </List.Item>
          )}
        />
      </div>
      {sessions.length > 0 && (
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          Current session is marked with a blue badge.
          {shouldScroll && ` (Showing 2 of ${sessions.length} sessions - scroll to see more)`}
        </Text>
      )}
    </Card>
  )
}
