import React from 'react'
import { Row, Col, Card, Typography, Divider, Form, Input, Flex, Button } from 'antd'
import { LogoutForm } from "@/features/authentication"
import { submitProviderAppeal, buildUserHeaders } from "@/features/provider/services"
import { useNotifier } from '@/shared/notifications.js'

export default function ProviderInactiveView({ provider, currentUser, reload }) {
  const { success, error } = useNotifier()

  const [appealForm] = Form.useForm()
  const latestChange = Array.isArray(provider?.accountStatusHistory)
    ? [...provider.accountStatusHistory].sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0))[0]
    : null

  return (
    <Row gutter={[12, 12]} style={{ padding: 24 }}>
      <Col span={8}>
        <LogoutForm />
      </Col>
      <Col span={16}>
        <Card title="Account Inactive">
          <Typography.Paragraph>
            Your provider account is currently inactive. You cannot access your workspace.
          </Typography.Paragraph>
          {latestChange?.reason ? (
            <Typography.Paragraph>
              <Typography.Text strong>Reason:</Typography.Text>{' '}
              <Typography.Text>{latestChange.reason}</Typography.Text>
            </Typography.Paragraph>
          ) : (
            <Typography.Text type="secondary">No reason available.</Typography.Text>
          )}
          <Divider />
          <Typography.Paragraph>
            If you believe this was a mistake or circumstances have changed, you can submit an appeal for review.
          </Typography.Paragraph>
          <Form
            form={appealForm}
            layout="vertical"
            onFinish={async (values) => {
              try {
                const res = await submitProviderAppeal(
                  { appealReason: String(values.appealReason || '').trim() },
                  buildUserHeaders(currentUser),
                )
                if (res) {
                  success('Appeal submitted')
                  appealForm.resetFields()
                  await reload()
                } else {
                  error(null, 'Failed to submit appeal')
                }
              } catch (err) {
                error(err, 'Failed to submit appeal')
              }
            }}
          >
            <Form.Item name="appealReason" label="Appeal Reason" rules={[{ required: true, message: 'Please describe your appeal' }] }>
              <Input.TextArea rows={4} placeholder="Explain why your account should be reactivated" />
            </Form.Item>
            <Flex justify="end">
              <Button type="primary" htmlType="submit">Submit Appeal</Button>
            </Flex>
          </Form>
          {Array.isArray(provider?.accountAppeals) && provider.accountAppeals.length > 0 && (
            <>
              <Divider />
              <Typography.Text strong>Appeal History</Typography.Text>
              {[...provider.accountAppeals].sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)).map((ap, idx) => (
                <div key={String(ap._id || idx)} style={{ marginTop: 8 }}>
                  <Typography.Text>{ap.appealReason || '-'}</Typography.Text>
                  <div>
                    <Typography.Text type="secondary">
                      {new Date(ap.submittedAt).toLocaleString()} — Status: {ap.status}
                      {ap.decidedAt ? `; decided ${new Date(ap.decidedAt).toLocaleString()} by ${ap.decidedByEmail || '-'}` : ''}
                    </Typography.Text>
                  </div>
                  {ap.decisionNotes && (
                    <Typography.Text type="secondary">Decision Notes: {ap.decisionNotes}</Typography.Text>
                  )}
                </div>
              ))}
            </>
          )}
        </Card>
      </Col>
    </Row>
  )
}