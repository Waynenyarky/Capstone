import React from 'react'
import { Button, Space } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import useWebAuthn from '../../hooks/useWebAuthn.js'
import { useAuthSession } from '../../hooks'
import { useNotifier } from '@/shared/notifications.js'

/**
 * Login-only passkey UI. Always shows "Sign in with Passkey".
 * No registration on login; "no passkeys" is shown as an error.
 * onBeforePasskeyAuth: optional async fn to run before modal passkey (e.g. abort conditional UI).
 */
export default function PasskeySignInOptions({ form, onAuthenticated, onBeforePasskeyAuth } = {}) {
  const { authenticateWithPlatform } = useWebAuthn()
  const { login } = useAuthSession()
  const { success, error: notifyError } = useNotifier()
  const [loading, setLoading] = React.useState(false)

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true)
      // Abort any pending conditional UI so we don't get "A request is already pending"
      if (typeof onBeforePasskeyAuth === 'function') {
        await onBeforePasskeyAuth()
      }
      // Always use discoverable flow: don't send email so the browser shows all passkeys for this site
      const res = await authenticateWithPlatform({ email: undefined })

      if (res && typeof res === 'object') {
        const remember = !!form?.getFieldValue('rememberMe')
        login(res, { remember })
        success('Logged in with passkey')
        if (typeof onAuthenticated === 'function') {
          onAuthenticated(res)
        }
      } else {
        notifyError('Passkey login did not return a valid user')
      }
    } catch (e) {
      if (e?.name !== 'NotAllowedError' && e?.code !== 'user_cancelled') {
        console.error('Passkey authentication failed', e)
      }

      if (e?.name === 'NotAllowedError' || e?.code === 'user_cancelled') {
        return
      }

      const errorCode = e?.code ||
        e?.originalError?.error?.code ||
        e?.originalError?.code ||
        (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
      const originalErrorMsg = (e?.message || '').toLowerCase()
      const statusCode = e?.status || e?.originalError?.status

      const isNoPasskeys =
        errorCode === 'no_passkeys' ||
        originalErrorMsg.includes('no passkeys registered') ||
        originalErrorMsg.includes('no passkeys found') ||
        (originalErrorMsg.includes('passkey') && originalErrorMsg.includes('register') && originalErrorMsg.includes('first'))

      const isCredentialNotFound =
        errorCode === 'credential_not_found' ||
        originalErrorMsg.includes('credential not recognized') ||
        originalErrorMsg.includes('credential not found')

      const noPasskeyForSite = isNoPasskeys || isCredentialNotFound || (statusCode === 404 && originalErrorMsg.includes('credential'))

      let errMsg = 'Passkey authentication failed. Please try again.'

      if (noPasskeyForSite) {
        errMsg = 'No passkey found for this site. Sign in with your email and password, then add a passkey in account settings.'
      } else if (errorCode === 'challenge_missing') {
        errMsg = 'Authentication session expired. Please try again.'
      } else if (errorCode === 'user_not_found') {
        errMsg = 'Account not found. Please check your email and try again.'
      } else if (errorCode === 'webauthn_auth_failed') {
        errMsg = 'Passkey verification failed. Please try again.'
      } else if (e?.name === 'InvalidStateError' || e?.name === 'NotFoundError') {
        errMsg = 'No passkey found for this site. Sign in with your email and password, then add a passkey in account settings.'
      } else if (e?.name === 'SecurityError') {
        errMsg = 'Security error. Please make sure you\'re using a supported browser and try again.'
      } else if (originalErrorMsg.includes('request is already pending')) {
        errMsg = 'A passkey prompt is already open. Close it or wait a moment, then try again.'
      } else if (e?.name === 'NotSupportedError') {
        errMsg = 'Passkeys are not supported on this device or browser. Please use a different device or browser.'
      } else if (e?.message && typeof e.message === 'string') {
        const msg = e.message.trim()
        if (msg && !msg.toLowerCase().includes('something went wrong')) {
          errMsg = msg
        }
      }

      const final = String(errMsg).trim() || 'Passkey authentication failed. Please try again.'
      notifyError(final.toLowerCase().includes('something went wrong') ? 'Passkey authentication failed. Please try again.' : final)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Button
        onClick={handlePasskeyAuth}
        type="default"
        block
        size="default"
        loading={loading}
        disabled={loading}
        icon={<SafetyCertificateOutlined />}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        {loading ? 'Signing in...' : 'Sign in with Passkey'}
      </Button>
    </Space>
  )
}
