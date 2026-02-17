import React from 'react'
import { Button, Popconfirm } from 'antd'
import { invalidateAllSessions } from '@/features/authentication/services/sessionService.js'
import { useNotifier } from '@/shared/notifications.js'

export default function InvalidateSessionsButton({ onDone }) {
  const { success, error } = useNotifier()

  const handleInvalidateAll = async () => {
    try {
      await invalidateAllSessions()
      success('Other sessions invalidated')
      onDone?.()
    } catch (err) {
      console.error('invalidate all failed', err)
      error(err, 'Could not invalidate sessions')
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <Popconfirm
        title="Invalidate all other sessions?"
        description="This will sign out your other devices."
        onConfirm={handleInvalidateAll}
      >
        <Button danger size="small">Invalidate All Other Sessions</Button>
      </Popconfirm>
    </div>
  )
}
