import { Form } from '@/shared/components/AppForm'
import { Button, Flex, Typography, List, Popconfirm } from 'antd'
import { theme } from 'antd'
import { WarningOutlined, InfoCircleOutlined, CheckCircleOutlined, HistoryOutlined, ScheduleOutlined } from '@ant-design/icons'
import { useConfirmDeleteAccountForm } from "@/features/authentication/hooks"
import { LegalAcknowledgmentCheckbox } from '@/features/user'

const { Title, Text, Paragraph } = Typography

export default function ConfirmDeleteAccountForm({ email, deleteToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useConfirmDeleteAccountForm({ email, deleteToken, onSubmit })
  const { token } = theme.useToken()

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
      

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: '0 0 8px' }}>Delete account</Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Your account will be scheduled for deletion in 30 days.
        </Paragraph>
      </div>

      <div style={{
        padding: 20,
        backgroundColor: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 24,
      }}>
        <Flex align="center" gap="small" style={{ marginBottom: 12 }}>
          <InfoCircleOutlined style={{ color: token.colorTextSecondary }} />
          <Text strong style={{ color: token.colorText }}>
            What happens to your data
          </Text>
        </Flex>
        <List
          split={false}
          dataSource={[
            { icon: <CheckCircleOutlined />, text: 'Your account and access will be removed' },
            { icon: <HistoryOutlined />, text: 'Some records may be retained for audit and legal compliance' },
            { icon: <ScheduleOutlined />, text: 'You have 30 days to change your mind' },
          ]}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0' }}>
              <Flex gap="small" align="start">
                <span style={{ color: token.colorTextSecondary, marginTop: 2 }}>{item.icon}</span>
                <Text type="secondary">{item.text}</Text>
              </Flex>
            </List.Item>
          )}
        />
      </div>

      <Form name="confirmDeleteAccount" form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item style={{ marginBottom: 16 }}>
          <LegalAcknowledgmentCheckbox />
        </Form.Item>
        <Form.Item style={{ marginBottom: 8 }}>
          <Popconfirm
            title="Schedule account deletion?"
            description="Your account will be scheduled for deletion in 30 days. You can cancel within that period."
            onConfirm={() => form.submit()}
            okText="Yes, schedule deletion"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              htmlType="button"
              loading={isSubmitting}
              disabled={isSubmitting}
              block
            >
              Schedule deletion
            </Button>
          </Popconfirm>
        </Form.Item>
        <div style={{ textAlign: 'center' }}>
          <Button type="text" onClick={() => window.history.back()} style={{ padding: 0 }}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
