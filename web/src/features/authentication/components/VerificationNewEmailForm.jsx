import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography } from 'antd'
import { useVerifyChangeEmailForm } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function VerificationNewEmailForm({ email, currentEmail, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyChangeEmailForm({ email, currentEmail, onSubmit })
  
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>{title || 'Verify New Email'}</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
           Enter the 6-digit code sent to <br/>
           <Text strong style={{ color: '#003a70' }}>{email}</Text>
        </Text>
      </div>

      <Form name="verification_new" form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item 
          name="verificationCode" 
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          style={{ marginBottom: 32 }}
          getValueFromEvent={(val) => {
            // Input.OTP returns a string directly
            if (typeof val === 'string') return val.replace(/\D/g, '').slice(0, 6)
            if (Array.isArray(val)) return val.join('').replace(/\D/g, '').slice(0, 6)
            return ''
          }}
        >
          <Input.OTP 
            length={6} 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            inputType="numeric"
            mask={false}
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
