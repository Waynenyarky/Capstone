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
  }, [])

  return (
    <Card
      title="Active Sessions"
      extra={<Button size="small" onClick={load} loading={loading}>Refresh</Button>}
    >
      <InvalidateSessionsButton onDone={load} />
      <List
        loading={loading}
        dataSource={sessions}
        locale={{ emptyText: 'No active sessions' }}
        renderItem={(session) => (
          <List.Item>
            <SessionCard session={session} onInvalidated={load} />
          </List.Item>
        )}
      />
      {sessions.length > 0 && (
        <Text type="secondary">Current session is marked with a blue badge.</Text>
      )}
    </Card>
  )
}
