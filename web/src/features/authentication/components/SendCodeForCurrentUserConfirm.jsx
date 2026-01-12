import { Button, Flex, Typography, Alert } from 'antd'
import { useSendCodeForCurrentUserConfirm } from '@/features/authentication/hooks'
import { MailOutlined } from '@ant-design/icons'
import { useEffect } from 'react'

export default function SendCodeForCurrentUserConfirm({ email, onSent, title, subtitle, autoSend = false } = {}) {
  const { isSending, handleSend } = useSendCodeForCurrentUserConfirm({ email, onSent })
  useEffect(() => {
    if (autoSend && email && !isSending) {
      handleSend()
    }
  }, [autoSend, email, isSending, handleSend])
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <MailOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Typography.Title level={3} style={{ margin: '0 0 8px' }}>
          {title || 'Send Verification Code'}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
          {subtitle || 'We will send a verification code to your current email to confirm it\'s you.'}
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
