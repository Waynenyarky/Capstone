import React from 'react'
import { Button, Tooltip, App } from 'antd'
import useWebAuthn from '@/features/authentication/hooks/useWebAuthn.js'
import { useAuthSession } from '@/features/authentication/hooks'

export default function WebAuthnRegister({ onRegistered } = {}) {
  const { message } = App.useApp()
  const { currentUser } = useAuthSession()
  const email = currentUser?.email
  const { register } = useWebAuthn()

  const handle = async () => {
    try {
      await register({ email })
      if (typeof onRegistered === 'function') onRegistered()
    } catch (e) {
      // Handle user cancellation - show friendly info message
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code
      
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        console.log('[WebAuthnRegister] User cancelled passkey registration')
        message.info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
        return
      }
      
      console.error('Passkey register failed', e)
    }
  }

  if (!email) return null
  return (
    <Tooltip title="Register a passkey (e.g., Windows Hello, Touch ID)">
      <Button type="default" onClick={handle}>Register Passkey</Button>
    </Tooltip>
  )
}
