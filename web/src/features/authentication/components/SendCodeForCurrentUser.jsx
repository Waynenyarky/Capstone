import { Button, Flex, Typography, Alert } from 'antd'
import { useSendVerificationCode } from "@/features/authentication/hooks"
import { SafetyOutlined } from '@ant-design/icons'

import { useEffect } from 'react'

export default function SendCodeForCurrentUser({ email, onSent, title, subtitle, autoSend = false } = {}) {
  const { isSending, handleSend } = useSendVerificationCode({ email, onSent })
  useEffect(() => {
    if (autoSend && email && !isSending) {
      handleSend()
    }
  }, [autoSend, email, isSending, handleSend])
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Typography.Title level={3} style={{ margin: '0 0 8px' }}>
          {title || 'Send Verification Code'}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
          {subtitle || 'We will send a verification code to your email.'}
        </Typography.Paragraph>
      </div>

      <Alert 
        message={email || 'Unknown email'} 
        type="info" 
        showIcon 
        style={{ maxWidth: 350, margin: '0 auto 24px', textAlign: 'left' }} 
      />

      <Button 
        type="primary" 
        onClick={handleSend} 
        loading={isSending} 
        disabled={isSending || !email}
        size="large"
        style={{ minWidth: 200 }}
      >
        Send Verification Code
      </Button>
    </div>
  )
}