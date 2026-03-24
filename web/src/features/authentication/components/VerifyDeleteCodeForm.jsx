import { Form } from '@/shared/components/AppForm'
import { Input, Button, Typography } from 'antd'
import { theme } from 'antd'
import { useVerifyDeleteAccountCode } from "@/features/authentication/hooks"

const { Title, Text } = Typography

export default function VerifyDeleteCodeForm({ email, onSubmit, title } = {}) {
  const { form, handleFinish, isSubmitting } = useVerifyDeleteAccountCode({ email, onSubmit })
  const { token } = theme.useToken()

  return (
    <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{title || 'Verify identity'}</Title>
        <Text type="secondary">
          Enter the 6-digit code sent to <Text strong style={{ color: token.colorText }}>{email}</Text>
        </Text>
      </div>

      <Form name="verifyDelete" form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          name="verificationCode"
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          style={{ marginBottom: 32 }}
          getValueFromEvent={(val) => {
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
          <Button
            type="primary"
            danger
            htmlType="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            block
          >
            Verify & continue
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}