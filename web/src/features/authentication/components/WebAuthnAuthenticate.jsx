import React from 'react'
import { Button, Tooltip } from 'antd'
import useWebAuthn from '@/features/authentication/hooks/useWebAuthn.js'
import { useAuthSession } from '@/features/authentication/hooks'

export default function WebAuthnAuthenticate({ onAuthenticated } = {}) {
  const { currentUser } = useAuthSession()
  const email = currentUser?.email
  const { authenticate } = useWebAuthn()

  const handle = async () => {
    try {
      const res = await authenticate({ email })
      if (typeof onAuthenticated === 'function') onAuthenticated(res)
    } catch (e) {
      console.error('Passkey authenticate failed', e)
    }
  }

  if (!email) return null
  return (
    <Tooltip title="Authenticate using a registered passkey">
      <Button type="default" onClick={handle}>Use Passkey</Button>
    </Tooltip>
  )
}
