import React from 'react'
import { Button, Tooltip } from 'antd'
import useWebAuthn from '@/features/authentication/hooks/useWebAuthn.js'
import { useAuthSession } from '@/features/authentication/hooks'

export default function WebAuthnRegister({ onRegistered } = {}) {
  const { currentUser } = useAuthSession()
  const email = currentUser?.email
  const { register } = useWebAuthn()

  const handle = async () => {
    try {
      await register({ email })
      if (typeof onRegistered === 'function') onRegistered()
    } catch (e) {
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
