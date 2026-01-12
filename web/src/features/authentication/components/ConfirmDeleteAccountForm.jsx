import { Form, Button, Flex, Typography, List } from 'antd'
import { WarningOutlined, InfoCircleOutlined, CheckCircleOutlined, HistoryOutlined, ScheduleOutlined } from '@ant-design/icons'
import { useConfirmDeleteAccountForm } from "@/features/authentication/hooks"

const { Title, Text, Paragraph } = Typography

export default function ConfirmDeleteAccountForm({ email, deleteToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useConfirmDeleteAccountForm({ email, deleteToken, onSubmit })
  
  return (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      {/* Irreversible Warning */}
      <div style={{
        padding: '16px',
        backgroundColor: '#fff1f0',
        borderRadius: '12px',
        border: '1px solid #ffccc7',
        marginBottom: '24px'
      }}>
        <Flex align="center" gap="middle">
          <WarningOutlined style={{ fontSize: '24px', color: '#cf1322' }} />
          <Text strong style={{ fontSize: '16px', color: '#cf1322' }}>
            This action is irreversible
          </Text>
        </Flex>
      </div>

      <Title level={2} style={{ marginTop: 0, textAlign: 'center' }}>Delete Account</Title>
      <Paragraph style={{ fontSize: '16px', marginBottom: '24px', textAlign: 'center', color: '#595959' }}>
        Your account will be scheduled for deletion in 30 days.
      </Paragraph>

      {/* Info Box */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #f0f0f0',
        marginBottom: '32px'
      }}>
        <Flex align="center" gap="small" style={{ marginBottom: '16px' }}>
          <InfoCircleOutlined style={{ color: '#595959' }} />
          <Text strong style={{ fontSize: '15px', color: '#262626' }}>
            What happens to your data:
          </Text>
        </Flex>
        
        <List
          split={false}
          dataSource={[
            { icon: <CheckCircleOutlined />, text: 'Profile and personal data will be deleted' },
            { icon: <HistoryOutlined />, text: 'Transaction records retained for auditing' },
            { icon: <ScheduleOutlined />, text: 'You have 30 days to change your mind' },
          ]}
          renderItem={item => (
            <List.Item style={{ padding: '6px 0' }}>
              <Flex gap="small" align="start">
                <span style={{ color: '#595959', marginTop: 2 }}>{item.icon}</span>
                <Text style={{ color: '#595959' }}>{item.text}</Text>
              </Flex>
            </List.Item>
          )}
        />
      </div>

      <Form name="confirmDeleteAccount" form={form} layout="vertical" onFinish={handleFinish}>
        <Flex vertical gap="large">
          <Button 
            type="primary" 
            danger 
            htmlType="submit" 
            size="large"
            loading={isSubmitting} 
            disabled={isSubmitting}
            block
            style={{ height: '48px', fontSize: '16px' }}
          >
            Schedule Deletion
          </Button>
          <Button type="text" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </Flex>
      </Form>
    </div>
  )
}
