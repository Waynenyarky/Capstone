import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography } from 'antd'
import { useVerifyChangeEmailForm } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function VerificationNewEmailForm({ email, currentEmail, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyChangeEmailForm({ email, currentEmail, onSubmit })
  
  const handleSubmit = async (values) => {
    // Normalize OTP value to ensure it's a single 6-digit string without spaces
    const normalizedCode = String(values.verificationCode || '').replace(/\D/g, '').slice(0, 6)
    // Ensure it's exactly 6 digits before sending
    if (normalizedCode.length !== 6) {
      // Let the form validation handle the length requirement
      await handleFinish({ ...values, verificationCode: normalizedCode })
      return
    }
    await handleFinish({ ...values, verificationCode: normalizedCode })
  }
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>{title || 'Verify New Email'}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
           Enter the 6-digit code sent to <br/>
           <Text strong style={{ color: '#003a70' }}>{email}</Text>
        </Text>
      </div>

      <Form name="verification_new" form={form} layout="vertical" onFinish={handleSubmit}  requiredMark={false}>
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Please enter a 6-digit code' }
          ]}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Input.OTP 
              length={6} 
              style={{ maxWidth: 280, justifyContent: 'center' }}
              inputType="numeric"
              mask={false}
              onChange={(value) => {
                // Ensure the form value is always a string without spaces
                const cleanValue = String(value || '').replace(/\D/g, '').slice(0, 6)
                form.setFieldsValue({ verificationCode: cleanValue })
              }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                if (allowedKeys.includes(e.key)) return
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            />
          </div>
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting} block>
            Verify
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
