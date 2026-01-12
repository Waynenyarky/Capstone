import { Button, Typography, Alert } from 'antd'
import { useSendDeleteAccountCode } from "@/features/authentication/hooks"
import { WarningOutlined } from '@ant-design/icons'

export default function SendDeleteCodeForCurrentUser({ email, onSent, title } = {}) {
  const { isSending, handleSend } = useSendDeleteAccountCode({ email, onSent })

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
        <Typography.Title level={3} style={{ margin: '0 0 8px' }}>
          {title || 'Request Account Deletion'}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
          To permanently delete your account, we first need to verify your identity.
        </Typography.Paragraph>
      </div>

      <Alert 
        message={email || 'Unknown email'} 
        type="warning" 
        showIcon 
        style={{ maxWidth: 350, margin: '0 auto 24px', textAlign: 'left' }} 
      />

      <Typography.Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto 24px', fontSize: 13 }}>
        Note: Deleting your account is irreversible. All your data will be permanently removed.
      </Typography.Paragraph>

      <Button 
        type="primary" 
        danger
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