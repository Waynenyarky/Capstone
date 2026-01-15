import { useState, useEffect } from 'react'
import { Card, Button, Typography, Space, Alert, Statistic, theme } from 'antd'
import { ClockCircleOutlined, UndoOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { getEmailChangeStatus, revertEmailChange } from '@/features/authentication/services/authService.js'
import { useNotifier } from '@/shared/notifications.js'
import { useAuthSession } from '@/features/authentication'

const { Title, Text, Paragraph } = Typography

export default function EmailChangeGracePeriod({ onReverted } = {}) {
  const { token } = theme.useToken()
  const { success, error } = useNotifier()
  const { login } = useAuthSession()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reverting, setReverting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (status?.expiresAt) {
      const updateTimer = () => {
        const now = new Date()
        const expires = new Date(status.expiresAt)
        const diff = expires - now
        
        if (diff <= 0) {
          setTimeRemaining(null)
          loadStatus()
          return
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTimeRemaining({ hours, minutes, seconds })
      }
      
      updateTimer()
      const timerInterval = setInterval(updateTimer, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [status?.expiresAt])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await getEmailChangeStatus()
      if (data?.pendingChange) {
        setStatus(data)
      } else {
        setStatus(null)
      }
    } catch (err) {
      console.error('Failed to load email change status:', err)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    try {
      setReverting(true)
      const data = await revertEmailChange()
      success('Email change has been reverted successfully')
      
      // Update user session
      if (data?.user) {
        const localRaw = localStorage.getItem('auth__currentUser')
        const remember = !!localRaw
        login(data.user, { remember })
      }
      
      setStatus(null)
      if (typeof onReverted === 'function') {
        onReverted()
      }
    } catch (err) {
      console.error('Failed to revert email change:', err)
      error(err, 'Failed to revert email change')
    } finally {
      setReverting(false)
    }
  }

  if (loading || !status) {
    return null
  }

  const canRevert = status.canRevert && timeRemaining

  return (
    <Alert
      message={
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WarningOutlined style={{ color: token.colorWarning }} />
            <Text strong>Email Change Pending</Text>
          </div>
          <Paragraph style={{ margin: 0, fontSize: 13 }}>
            Your email was changed from <strong>{status.oldEmail}</strong> to <strong>{status.newEmail}</strong>.
            {canRevert ? (
              <>
                {' '}You have <strong>{timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s</strong> to revert this change.
              </>
            ) : (
              ' The grace period has expired.'
            )}
          </Paragraph>
          {canRevert && (
            <Button
              type="primary"
              danger
              size="small"
              icon={<UndoOutlined />}
              onClick={handleRevert}
              loading={reverting}
              style={{ marginTop: 8 }}
            >
              Revert Email Change
            </Button>
          )}
        </Space>
      }
      type="warning"
      showIcon={false}
      style={{ marginBottom: 24 }}
    />
  )
}
