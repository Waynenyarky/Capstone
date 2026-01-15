import React, { useState, useEffect } from 'react'
import { Card, Typography, Flex, Button, Space, Statistic } from 'antd'
import { 
  WarningOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined,
  UndoOutlined
} from '@ant-design/icons'
import { useAuthSession } from "@/features/authentication"
import { useCancelDeleteAccount } from "@/features/authentication/hooks"

const { Title, Text, Paragraph } = Typography

export default function DeletionScheduledBanner() {
  const { currentUser } = useAuthSession()
  const { cancel, isLoading } = useCancelDeleteAccount()
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    if (currentUser?.deletionScheduledFor) {
      const scheduledDate = new Date(currentUser.deletionScheduledFor)
      const now = new Date()
      const diffTime = Math.abs(scheduledDate - now)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
    }
  }, [currentUser])

  if (!currentUser?.deletionPending) return null

  const date = currentUser?.deletionScheduledFor ? new Date(currentUser.deletionScheduledFor) : null
  const dateStr = date ? date.toLocaleString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'soon'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Warning Banner - Matches Mobile's Orange Container */}
      <div style={{
        padding: '24px',
        backgroundColor: '#fff7e6',
        borderRadius: '16px',
        border: '2px solid #ffcc80',
        textAlign: 'center'
      }}>
        <WarningOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
        <Title level={3} style={{ margin: '0 0 8px 0', color: '#d46b08' }}>
          Deletion Scheduled
        </Title>
        <Text style={{ fontSize: '16px', color: '#d46b08' }}>
          Your account is scheduled to be deleted
        </Text>
      </div>

      {/* Countdown Card - Matches Mobile's Gradient Card */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%)',
        borderRadius: '16px',
        border: '1px solid #ffccc7',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Flex vertical align="center" gap="middle">
          <Flex align="center" gap="small">
            <ClockCircleOutlined style={{ fontSize: '24px', color: '#cf1322' }} />
            <Text strong style={{ fontSize: '24px', color: '#cf1322' }}>
              {daysRemaining} days remaining
            </Text>
          </Flex>

          <div style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            <Flex vertical align="center">
              <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Deletion Date
              </Text>
              <Space style={{ marginTop: 4 }}>
                <CalendarOutlined style={{ color: '#cf1322' }} />
                <Text strong style={{ color: '#820014' }}>{dateStr}</Text>
              </Space>
            </Flex>
          </div>
        </Flex>
      </div>

      {/* Action Area */}
      <Card variant="borderless" style={{ background: 'transparent' }}>
        <Flex vertical gap="small">
          <Button 
            type="primary" 
            size="large" 
            onClick={cancel} 
            loading={isLoading}
            icon={<UndoOutlined />}
            block
            style={{ height: '48px', fontSize: '16px' }}
          >
            Undo Deletion & Restore Access
          </Button>
          <Text type="secondary" style={{ textAlign: 'center', fontSize: '13px' }}>
            Restoring access will immediately cancel the scheduled deletion.
          </Text>
        </Flex>
      </Card>
    </Space>
  )
}
