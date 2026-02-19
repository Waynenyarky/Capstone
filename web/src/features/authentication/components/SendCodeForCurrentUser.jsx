import { Button, Typography, Grid } from 'antd'
import { useSendVerificationCode } from "@/features/authentication/hooks"
import { useEffect } from 'react'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function SendCodeForCurrentUser({
  email,
  onSent,
  title,
  subtitle,
  autoSend = false,
  onBack,
} = {}) {
  const { isSending, handleSend } = useSendVerificationCode({ email, onSent })
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const showBack = typeof onBack === 'function'

  useEffect(() => {
    if (autoSend && email && !isSending) {
      handleSend()
    }
  }, [autoSend, email, isSending, handleSend])

  return (
    <div style={{ maxWidth: 300, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
        <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? 12 : 16 }}>
          {title || 'Send Verification Code'}
        </Title>
        <Text type="secondary">
          {subtitle || "We'll send a verification code to your email."}
        </Text>
        {email && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">Code will be sent to </Text>
            <Text strong>{email}</Text>
          </div>
        )}
      </div>

      <Button
        type="primary"
        onClick={handleSend}
        loading={isSending}
        disabled={isSending || !email}
        block
        style={{ marginBottom: 16 }}
      >
        Send Verification Code
      </Button>

      {showBack && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="text" onClick={onBack} style={{ padding: 0 }}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}