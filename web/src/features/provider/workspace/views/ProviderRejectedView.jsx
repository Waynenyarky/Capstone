import React from 'react'
import { Row, Col, Card, Typography, Divider, Flex, Button } from 'antd'
import { LogoutForm } from "@/features/authentication"
import { EditProviderProfileForm } from "@/features/provider"
import { useNotifier } from '@/shared/notifications.js'

export default function ProviderRejectedView({ provider, isSubmitting, resubmit, reload }) {
  const { success, error } = useNotifier()
  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        <LogoutForm />
      </Col>
      <Col span={16}>
        <Card title="Application Rejected">
          <Typography.Paragraph>
            Your provider application has been rejected.
          </Typography.Paragraph>
          {(provider?.rejectionReason || '').trim() ? (
            <Typography.Paragraph>
              <Typography.Text strong>Reason:</Typography.Text>{' '}
              <Typography.Text>{(provider?.rejectionReason || '').trim()}</Typography.Text>
            </Typography.Paragraph>
          ) : (
            <Typography.Text type="secondary">
              No additional reason was provided.
            </Typography.Text>
          )}
          <Typography.Text type="secondary">
            You may contact support if you believe this is an error.
          </Typography.Text>
          <Divider />
          <Typography.Paragraph>
            You can edit your business profile below and resubmit your application for review.
          </Typography.Paragraph>
          <Flex justify="end" style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={async () => {
                const result = await resubmit()
                if (result && result.resubmitted) {
                  success('Application resubmitted for review')
                  await reload()
                } else {
                  error(null, 'Failed to resubmit application')
                }
              }}
            >
              Resubmit Application
            </Button>
          </Flex>
          <EditProviderProfileForm />
        </Card>
      </Col>
    </Row>
  )
}