import React from 'react'
import { Button, Space, Typography, Modal, Input, Alert, Flex, theme } from 'antd'
import { 
  ClockCircleOutlined, 
  UndoOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  SecurityScanOutlined,
  LockOutlined
} from '@ant-design/icons'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'

const { Text, Paragraph, Title } = Typography

export default function LoggedInMfaManager() {
  const { token } = theme.useToken()
  const { currentTheme } = useAppTheme()
  const isDarkTheme = currentTheme === THEMES.DARK

  const {
    currentUser,
    loading,
    enabled,
    statusFetchFailed,
    disablePending,
    scheduledFor,
    countdown,
    confirmModalVisible,
    setConfirmModalVisible,
    confirmCode,
    setConfirmCode,
    undoModalVisible,
    setUndoModalVisible,
    undoCode,
    setUndoCode,
    handleOpenSetup,
    handleDisable,
    confirmDisable,
    confirmUndo
  } = useLoggedInMfaManager()

  if (!currentUser) return null

  return (
    <div>
      {statusFetchFailed && (
        <Alert 
          type="warning" 
          showIcon 
          message="Connection Issue"
          description="Could not retrieve MFA status. Some actions may be unavailable."
          style={{ marginBottom: 16 }}
        />
      )}

      {disablePending && scheduledFor && (
        <Alert
          type="error"
          showIcon
          icon={<ClockCircleOutlined />}
          message="MFA Disable Requested"
          description={
            <div style={{ marginTop: 4 }}>
               <Paragraph style={{ marginBottom: 0 }}>
                 Your request to disable MFA is pending. It will be disabled on <strong>{new Date(scheduledFor).toLocaleString()}</strong>.
               </Paragraph>
               <div style={{ marginTop: 8, fontWeight: 600, color: token.colorError }}>
                 Time remaining: {countdown}
               </div>
            </div>
          }
          style={{ marginBottom: 24, border: `1px solid ${token.colorErrorBorder}` }}
          action={
            <Button 
              size="small" 
              type="primary" 
              danger 
              ghost 
              icon={<UndoOutlined />} 
              onClick={() => setUndoModalVisible(true)}
            >
              Undo Request
            </Button>
          }
        />
      )}
      
      {/* Status Card */}
      <div style={{ 
        padding: 24, 
        background: enabled 
            ? (isDarkTheme ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed') 
            : (isDarkTheme ? 'rgba(250, 173, 20, 0.15)' : '#fffbe6'), 
        border: `1px solid ${enabled 
            ? (isDarkTheme ? '#237804' : '#b7eb8f') 
            : (isDarkTheme ? '#d48806' : '#ffe58f')}`,
        borderRadius: token.borderRadiusLG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, maxWidth: '70%' }}>
          {enabled ? (
            <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a', marginTop: 4 }} />
          ) : (
            <SecurityScanOutlined style={{ fontSize: 32, color: '#faad14', marginTop: 4 }} />
          )}
          <div>
            <Title level={5} style={{ margin: 0, marginBottom: 4, color: isDarkTheme ? '#fff' : undefined }}>
              {enabled ? 'Two-Factor Authentication is active' : 'Two-Factor Authentication is not enabled'}
            </Title>
            <Text type="secondary" style={{ color: isDarkTheme ? 'rgba(255, 255, 255, 0.65)' : undefined }}>
              {enabled 
                ? 'Your account is protected with an extra layer of security.' 
                : 'Protect your account by requiring a verification code when signing in.'}
            </Text>
          </div>
        </div>
        
        <div>
          {enabled ? (
            <Button 
              danger 
              onClick={handleDisable} 
              disabled={loading || disablePending}
              icon={<LockOutlined />}
            >
              Disable MFA
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleOpenSetup} 
              disabled={loading}
              icon={<SafetyCertificateOutlined />}
            >
              Setup MFA
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Disable Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: token.colorWarning, fontSize: 22 }} />
            <span>Disable Two-Factor Authentication</span>
          </Space>
        }
        open={confirmModalVisible}
        onOk={confirmDisable}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Disable MFA"
        okButtonProps={{ danger: true, size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
        width={480}
        centered
      >
        <div style={{ padding: '24px 0' }}>
          <Alert 
            type="warning" 
            showIcon
            message="Security Delay"
            description="For your security, disabling MFA requires a 24-hour waiting period. You can cancel this request at any time during the countdown."
            style={{ marginBottom: 24 }}
          />
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Paragraph style={{ fontSize: 16 }}>
              Enter the 6-digit code from your authenticator app
            </Paragraph>
            <div 
              style={{ display: 'flex', justifyContent: 'center' }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                if (allowedKeys.includes(e.key)) return
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                const numericOnly = pastedText.replace(/[^0-9]/g, '').slice(0, 6)
                if (numericOnly) {
                  setConfirmCode(numericOnly)
                }
              }}
            >
              <Input.OTP 
                length={6} 
                value={confirmCode}
                onChange={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6)
                  setConfirmCode(numericValue)
                }}
                size="large"
                inputType="numeric"
                mask={false}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Undo Disable Modal */}
      <Modal
        title={
          <Space>
            <UndoOutlined style={{ color: token.colorPrimary, fontSize: 22 }} />
            <span>Cancel Disable Request</span>
          </Space>
        }
        open={undoModalVisible}
        onOk={confirmUndo}
        onCancel={() => setUndoModalVisible(false)}
        okText="Keep MFA Enabled"
        okButtonProps={{ type: 'primary', size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
        width={480}
        centered
      >
        <div style={{ padding: '24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Verify your identity to cancel the pending disable request.
            </Paragraph>
            <div 
              style={{ display: 'flex', justifyContent: 'center' }}
              onKeyDown={(e) => {
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
                if (allowedKeys.includes(e.key)) return
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                const numericOnly = pastedText.replace(/[^0-9]/g, '').slice(0, 6)
                if (numericOnly) {
                  setUndoCode(numericOnly)
                }
              }}
            >
              <Input.OTP 
                length={6} 
                value={undoCode}
                onChange={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6)
                  setUndoCode(numericValue)
                }}
                size="large"
                inputType="numeric"
                mask={false}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
