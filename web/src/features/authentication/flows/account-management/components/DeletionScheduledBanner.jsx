import { useState, useEffect } from 'react'
import { Typography, Flex, Button } from 'antd'
import { theme } from 'antd'
import { ClockCircleOutlined, CalendarOutlined, UndoOutlined } from '@ant-design/icons'
import { useAuthSession } from '@/features/authentication'
import { useCancelDeleteAccount } from '../hooks/useCancelDeleteAccount.js'

const { Text, Paragraph } = Typography

export default function DeletionScheduledBanner() {
  const { currentUser } = useAuthSession()
  const { cancel, isLoading } = useCancelDeleteAccount()
  const { token } = theme.useToken()
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    if (currentUser?.deletionScheduledFor) {
      const scheduledDate = new Date(currentUser.deletionScheduledFor)
      const now = new Date()
      const diffTime = Math.max(0, scheduledDate - now)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
    }
  }, [currentUser?.deletionScheduledFor])

  if (!currentUser?.deletionPending) return null

  const date = currentUser?.deletionScheduledFor ? new Date(currentUser.deletionScheduledFor) : null
  const dateStr = date
    ? date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: token.colorErrorBg,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorErrorBorder}`,
        marginBottom: 24,
      }}
    >
      <Flex align="center" gap="small" style={{ marginBottom: 12 }}>
        <ClockCircleOutlined style={{ color: token.colorError }} />
        <Text strong style={{ color: token.colorError }}>
          {daysRemaining} days remaining
        </Text>
      </Flex>
      <Flex align="center" gap="small" style={{ marginBottom: 16 }}>
        <CalendarOutlined style={{ color: token.colorTextSecondary }} />
        <Text type="secondary">Deletion date: {dateStr}</Text>
      </Flex>
      <Button
        type="primary"
        onClick={cancel}
        loading={isLoading}
        icon={<UndoOutlined />}
        block
      >
        Undo deletion & restore access
      </Button>
      <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
        Restoring will cancel the scheduled deletion immediately.
      </Paragraph>
    </div>
  )
}
