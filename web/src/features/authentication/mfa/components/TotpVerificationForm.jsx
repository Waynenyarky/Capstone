import { Button, Input, Typography, Flex, Form } from 'antd'
import { useTotpVerificationForm } from '@/features/authentication/hooks'

const { Title, Text } = Typography

export default function TotpVerificationForm({ email, onSubmit, title } = {}) {
  const { code, setCode, codeError, handleVerify, isSubmitting } = useTotpVerificationForm({ email, onSubmit })
  const [form] = Form.useForm()
  const cardTitle = title || 'MFA Verification'

  return (
    <div
      style={{
        maxWidth: 300,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 8 }}>{cardTitle}</Title>
        <Text type="secondary">
          Enter the code from your authenticator app
        </Text>
      </div>

      <Form form={form} layout="vertical" onFinish={handleVerify} requiredMark={false}>
        <Form.Item
          name="code"
          rules={[
            { required: true, message: 'Please enter the verification code' },
            { pattern: /^[0-9]{6}$/, message: 'Code must be exactly 6 digits' }
          ]}
          style={{ marginBottom: 32 }}
          help={codeError}
          validateStatus={codeError ? 'error' : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Input.OTP
              length={6}
              value={code}
              onChange={setCode}
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              inputType="numeric"
              mask={false}
            />
          </div>
        </Form.Item>

        <Flex vertical gap="middle">
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={code.length !== 6 || isSubmitting}
            block
          >
            Verify
          </Button>
        </Flex>
      </Form>
    </div>
  )
}
