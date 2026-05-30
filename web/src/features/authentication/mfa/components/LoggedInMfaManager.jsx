import { useState, useEffect } from 'react'
import { Button, Space, Typography, Modal, Input, Alert, theme, message } from 'antd'
import {
  ClockCircleOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'

const { Paragraph, Title } = Typography

/**
 * @param {object} props
 * @param {boolean} [props.isAdmin]
 * @param {boolean} [props.hasPasskeys]
 * @param {() => void} [props.onOpenSetupForm] - If provided, "Setup MFA" opens the form inline (e.g. in settings tab) instead of navigating to /account/security.
 */
export default function LoggedInMfaManager({ isAdmin = false, hasPasskeys = false, onOpenSetupForm }) {
  const { token } = theme.useToken()
  const [switchConfirmVisible, setSwitchConfirmVisible] = useState(false)

  const {
    currentUser,
    role,
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
    confirmDisableWithoutVerify,
    confirmUndo
  } = useLoggedInMfaManager()

  const roleKey = String(role?.slug ?? role ?? '').toLowerCase()
  const canDisableMfa = roleKey === 'business_owner'
  // Use the hasPasskeys prop if provided, otherwise fall back to internal detection
  const actualHasPasskeys = hasPasskeys !== undefined ? hasPasskeys : enabled
  const passkeyOnly = actualHasPasskeys && !enabled

  const openSetup = () => {
    if (typeof onOpenSetupForm === 'function') {
      onOpenSetupForm()
    } else {
      handleOpenSetup()
    }
  }

  const handleSetupClick = () => {
    if (isAdmin && hasPasskeys) {
      setSwitchConfirmVisible(true)
    } else {
      openSetup()
    }
  }

  useEffect(() => {
    if (statusFetchFailed) {
      message.warning('Could not retrieve MFA status. Some actions may be unavailable.')
    }
  }, [statusFetchFailed])

  const confirmSwitchToMfa = () => {
    setSwitchConfirmVisible(false)
    openSetup()
  }

  if (!currentUser) return null

  // User has 2FA if they have TOTP/authenticator enabled OR at least one passkey
  // Prioritize session data (currentUser.mfaEnabled) over API call when available
  const sessionMfaEnabled = currentUser?.mfaEnabled === true
  const effectiveEnabled = sessionMfaEnabled || enabled || actualHasPasskeys

  return (
    <div style={{ maxWidth: 300, width: '100%', margin: '0 auto' }}>
      {canDisableMfa && disablePending && scheduledFor && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <ClockCircleOutlined style={{ fontSize: 32, color: token.colorError }} />
            <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
              MFA Disable Requested
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Your request to disable MFA is pending. It will be disabled on:
            </Paragraph>
          </div>

          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: token.colorError,
            padding: '12px 16px',
            backgroundColor: token.colorErrorBg,
            borderRadius: '8px',
            border: `1px solid ${token.colorErrorBorder}`,
            textAlign: 'center',
            marginBottom: 16
          }}>
            {new Date(scheduledFor).toLocaleString()}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 500, color: token.colorError, textAlign: 'center', marginBottom: 16 }}>
            Time remaining: {countdown}
          </div>

          <Button
            type="primary"
            danger
            icon={<UndoOutlined />}
            onClick={() => setUndoModalVisible(true)}
            block
          >
            Undo Request
          </Button>
        </div>
      )}

      {!disablePending && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 8 }}>
              Multi-Factor Authentication
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              {effectiveEnabled
                ? (actualHasPasskeys && !enabled
                  ? 'Your account is protected with passkey sign-in.'
                  : 'Your account is protected with multi-factor authentication. Manage your security settings below.')
                : 'Protect your account by requiring a verification code or passkey when signing in.'}
            </Paragraph>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {effectiveEnabled ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  type="primary"
                  onClick={handleSetupClick}
                  disabled={loading}
                  block
                >
                  Manage MFA
                </Button>
                {canDisableMfa && (
                  <Button
                    danger
                    onClick={handleDisable}
                    disabled={loading || disablePending}
                    block
                  >
                    Disable MFA
                  </Button>
                )}
              </Space>
            ) : (
              <Button
                type="primary"
                onClick={handleSetupClick}
                disabled={loading}
                block
              >
                Setup MFA
              </Button>
            )}
          </Space>
        </div>
      )}
      
      {/* Confirm Disable Modal — passkey-only: no code; TOTP: require 6-digit code */}
      <Modal
        title="Disable Two-Factor Authentication"
        open={confirmModalVisible}
        onOk={passkeyOnly ? confirmDisableWithoutVerify : confirmDisable}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Disable MFA"
        okButtonProps={{
          danger: true,
          loading,
          disabled: !passkeyOnly && confirmCode.replace(/\D/g, '').length !== 6
        }}
        cancelButtonProps={{ disabled: loading }}
        width={400}
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
          {passkeyOnly ? (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              You use passkey sign-in. Click &quot;Disable MFA&quot; and you will be asked to verify with your passkey before the request is scheduled.
            </Paragraph>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Paragraph style={{ fontSize: 16 }}>
                Enter the 6-digit code from your authenticator app
              </Paragraph>
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div
                style={{ display: 'flex', justifyContent: 'center', maxWidth: 320, margin: '0 auto' }}
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
                  inputType="numeric"
                  mask={false}
                  style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Admin: switch from passkey to MFA confirmation */}
      <Modal
        title="Switch to Two-Factor Authentication"
        open={switchConfirmVisible}
        onOk={confirmSwitchToMfa}
        onCancel={() => setSwitchConfirmVisible(false)}
        okText="Continue"
        cancelText="Cancel"
        centered
      >
        <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          Enabling Two-Factor Authentication will <strong>disable passkey authentication</strong>. You will need to use an authenticator app to sign in. Continue?
        </Paragraph>
      </Modal>

      {/* Undo Disable Modal — passkey-only: no code; TOTP: require 6-digit code */}
      <Modal
        title="Cancel Disable Request"
        open={undoModalVisible}
        onOk={() => confirmUndo(passkeyOnly)}
        onCancel={() => setUndoModalVisible(false)}
        okText="Keep MFA Enabled"
        okButtonProps={{
          type: 'primary',
          loading,
          disabled: !passkeyOnly && undoCode.replace(/\D/g, '').length !== 6
        }}
        cancelButtonProps={{ disabled: loading }}
        width={400}
        centered
      >
        <div style={{ padding: '24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: passkeyOnly ? 0 : 24 }}>
            <Paragraph type="secondary" style={{ marginBottom: passkeyOnly ? 0 : 24 }}>
              {passkeyOnly
                ? 'Click "Keep MFA Enabled" and you will be asked to verify with your passkey to cancel the disable request.'
                : 'Verify your identity to cancel the pending disable request.'}
            </Paragraph>
            {!passkeyOnly && (
              /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
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
                  if (numericOnly) setUndoCode(numericOnly)
                }}
              >
                <Input.OTP
                  length={6}
                  value={undoCode}
                  onChange={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6)
                    setUndoCode(numericValue)
                  }}
                  inputType="numeric"
                  mask={false}
                  style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
