/**
 * Presentation Page: PasskeyMobileAuth (Refactored)
 * Main page component for cross-device authentication
 * Follows Clean Architecture: Presentation Layer only
 */
import React from 'react'
import { Card, Typography, Space, Alert } from 'antd'
import { AuthLayout } from '@/features/authentication'
import { useCrossDeviceAuth } from '@/features/authentication/presentation/passkey/hooks/useCrossDeviceAuth'
import CrossDeviceAuthStatus from '@/features/authentication/presentation/passkey/components/CrossDeviceAuthStatus'

const { Title } = Typography

export default function PasskeyMobileAuth() {
  const { status, error, sessionId, handleAuthenticate, handleDeny } = useCrossDeviceAuth()

  if (!sessionId) {
    return (
      <AuthLayout>
        <Card>
          <Alert
            message="Invalid Session"
            description="The authentication session is invalid or expired. Please scan the QR code again."
            type="error"
            showIcon
          />
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card style={{ maxWidth: 400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3}>Approve Sign-In</Title>
          
          <CrossDeviceAuthStatus
            status={status}
            error={error}
            onRetry={handleAuthenticate}
            onDeny={handleDeny}
          />
        </Space>
      </Card>
    </AuthLayout>
  )
}
