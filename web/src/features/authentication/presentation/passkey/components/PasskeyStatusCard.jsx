/**
 * Presentation Component: PasskeyStatusCard
 * Displays passkey status - pure presentation, no business logic
 */
import React from 'react'
import { Button, Typography, Space } from 'antd'
import { SafetyCertificateOutlined, SecurityScanOutlined, LockOutlined } from '@ant-design/icons'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { theme } from 'antd'

const { Title, Text } = Typography

export default function PasskeyStatusCard({ 
  hasPasskeys, 
  credentialsCount, 
  onRegister, 
  onDisable, 
  deleting,
  registering,
  loading 
}) {
  const { token } = theme.useToken()
  const { currentTheme } = useAppTheme()
  const isDarkTheme = currentTheme === THEMES.DARK

  return (
    <div style={{ 
      padding: 24, 
      background: hasPasskeys 
          ? (isDarkTheme ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed') 
          : (isDarkTheme ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6'), 
      border: `1px solid ${hasPasskeys 
          ? (isDarkTheme ? '#237804' : '#b7eb8f') 
          : (isDarkTheme ? '#d48806' : '#ffe58f')}`,
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 20,
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasPasskeys ? (
          <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a' }} />
        ) : (
          <SecurityScanOutlined style={{ fontSize: 32, color: '#faad14' }} />
        )}
      </div>
      <div>
        <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
          {hasPasskeys ? 'Passkey Authentication is active' : 'Passkey Authentication is not enabled'}
        </Title>
        <Text type="secondary" style={{ display: 'block' }}>
          {hasPasskeys 
            ? `You have ${credentialsCount} passkey${credentialsCount > 1 ? 's' : ''} registered. You can use them to sign in.` 
            : 'Enable passwordless authentication using Windows Hello, Touch ID, Face ID, or security keys.'}
        </Text>
      </div>
      
      <div>
        {hasPasskeys ? (
          <Button 
            danger 
            onClick={onDisable} 
            disabled={deleting || loading}
            icon={<LockOutlined />}
          >
            Disable Passkeys
          </Button>
        ) : (
          <Button 
            type="primary" 
            onClick={onRegister} 
            disabled={registering || loading}
            icon={<SafetyCertificateOutlined />}
          >
            Register Passkey
          </Button>
        )}
      </div>
    </div>
  )
}
