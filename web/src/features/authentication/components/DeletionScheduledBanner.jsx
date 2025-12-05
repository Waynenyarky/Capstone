import React from 'react'
import { Card, Typography, Flex, Button } from 'antd'
import { useAuthSession } from "@/features/authentication"
import { useCancelDeleteAccount } from "@/features/authentication/hooks"

export default function DeletionScheduledBanner() {
  const { currentUser } = useAuthSession()
  const { cancel } = useCancelDeleteAccount()

  if (!currentUser?.deletionPending) return null

  const date = currentUser?.deletionScheduledFor ? new Date(currentUser.deletionScheduledFor) : null
  const dateStr = date ? date.toLocaleString() : 'soon'

  return (
    <Card title="Account Deletion Scheduled" variant="outlined" style={{ background: '#fff7e6', borderColor: '#ffe58f' }}>
      <Typography.Paragraph>
        Your account is scheduled to be deleted on <strong>{dateStr}</strong>.
      </Typography.Paragraph>
      <Typography.Text type="secondary">
        You can undo this and keep your account.
      </Typography.Text>
      <Flex justify="end" gap="small" style={{ marginTop: 12 }}>
        <Button type="primary" onClick={cancel}>Undo deletion</Button>
      </Flex>
    </Card>
  )
}