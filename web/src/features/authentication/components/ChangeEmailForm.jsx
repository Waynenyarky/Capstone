import { Form, Input, Button, Typography } from 'antd'
import { useChangeEmailForm } from "@/features/authentication/hooks"
import { emailRules } from "@/features/authentication/utils/validations"
import { MailOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function ChangeEmailForm({ currentEmail, resetToken, onSubmit } = {}) {
  const { form, handleFinish, isSubmitting } = useChangeEmailForm({ email: currentEmail, resetToken, onSubmit })
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>Enter New Email Address</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
           Please enter the new email address you would like to associate with your account.
        </Text>
      </div>

      <Form 
        name="changeEmail" 
        form={form} 
        layout="vertical" 
        onFinish={handleFinish} 
        initialValues={{ newEmail: '' }}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="newEmail"
          rules={[
            ...emailRules,
            () => ({
              validator(_, value) {
                if (!value || value !== currentEmail) return Promise.resolve()
                return Promise.reject(new Error('New email must be different from current email'))
              },
            }),
          ]}
          style={{ marginBottom: 32 }}
        >
          <Input 
            prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
            placeholder="New Email Address" 
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block size="large" style={{ height: 48, fontSize: 16 }}>
            Continue
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}